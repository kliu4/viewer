package viewer.service;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URLDecoder;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.log4j.Logger;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.input.SAXBuilder;

@Path("/")
@Produces("application/xml;charset=UTF-8")
public class Dispatcher {
	static final Logger LOGGER = Logger.getLogger(Dispatcher.class);

	@GET
	public String getRequest(@QueryParam("serviceType") String serviceType,
			@QueryParam("serviceUrl") String serviceUrl) throws IOException {
		// String encoded = FileUtils.readFileToString(new
		// File("/Users/kailiu/Downloads/coawst.xml"));
		// return encoded;

		String remoteUrl = formatUrl(serviceUrl, serviceType);
		if(serviceType==null)
			return "";
		else if ("KMZ".equalsIgnoreCase(serviceType))
			return getKmzContents(remoteUrl);
		else
			return getContents(remoteUrl);

	}

	public String getContents(String remoteUrl) {

		HttpClient httpClient = new DefaultHttpClient();
		String result = "";
		try {
			HttpGet httpGetRequest = new HttpGet(remoteUrl);
			HttpResponse httpResponse = httpClient.execute(httpGetRequest);

			LOGGER.info(remoteUrl + " - " + httpResponse.getStatusLine());

			HttpEntity entity = httpResponse.getEntity();
			byte[] buffer = new byte[1024];
			if (entity != null) {
				InputStream inputStream = entity.getContent();
				try {
					int bytesRead = 0;
					BufferedInputStream bis = new BufferedInputStream(
							inputStream);
					while ((bytesRead = bis.read(buffer)) != -1) {
						String chunk = new String(buffer, 0, bytesRead);
						result += chunk;
					}
				} catch (IOException ioException) {
					ioException.printStackTrace();
				} catch (RuntimeException runtimeException) {
					httpGetRequest.abort();
					runtimeException.printStackTrace();
				} finally {
					try {
						inputStream.close();
					} catch (Exception ignore) {
					}
				}
			}
		} catch (ClientProtocolException e) {
			e.printStackTrace();
		} catch (IllegalStateException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			httpClient.getConnectionManager().shutdown();
		}

		// some kml is kmz,
		// some unzipped kmz is still kmz

		return result;
	}

	public String getKmzContents(String kmzUrl) {
		HttpClient httpClient = new DefaultHttpClient();
		String result = "";
		try {
			HttpGet httpGetRequest = new HttpGet(kmzUrl);
			HttpResponse httpResponse = httpClient.execute(httpGetRequest);

			LOGGER.info(kmzUrl + " - " + httpResponse.getStatusLine());

			HttpEntity entity = httpResponse.getEntity();
			byte[] buffer = new byte[1024];
			if (entity != null) {
				InputStream inputStream = entity.getContent();

				ZipInputStream zin = new ZipInputStream(inputStream);
				try {
					ZipInputStream inStream = zin;
					ByteArrayOutputStream outStream = new ByteArrayOutputStream();

					ZipEntry entry;
					int nrBytesRead;

					if ((entry = inStream.getNextEntry()) != null) {
						while ((nrBytesRead = inStream.read(buffer)) > 0) {
							outStream.write(buffer, 0, nrBytesRead);
						}
					}
					result = outStream.toString();
				} catch (IOException ioException) {
					ioException.printStackTrace();
				} catch (RuntimeException runtimeException) {
					httpGetRequest.abort();
					runtimeException.printStackTrace();
				} finally {
					try {
						inputStream.close();
					} catch (Exception ignore) {
					}
				}
			}
		} catch (ClientProtocolException e) {
			e.printStackTrace();
		} catch (IllegalStateException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			httpClient.getConnectionManager().shutdown();
		}

		// some unzipped kmz is still kmz

		try {
			return getRecursionContents(result);
		} catch (JDOMException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return "";
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return "";
		}
	}

	private String getRecursionContents(String result) throws JDOMException,
			IOException {
		SAXBuilder jdomBuilder = new SAXBuilder();

		// jdomDocument is the JDOM2 Object
		StringReader xmlReader = new StringReader(result);
		Document jdomDocument = jdomBuilder.build(xmlReader);

		Element rss = jdomDocument.getRootElement();
		try {
			String href = rss.getChild("NetworkLink").getChild("Url")
					.getChildText("href");
			if (href == null)
				return result;
			else if (href.split("?")[0].toLowerCase().contains(".kmz"))
				return getKmzContents(href);
			else
				return getContents(href);
		} catch (NullPointerException e) {
			return result;
		}
	}

	private String formatUrl(String serviceUrl, String serviceType) {
		String remoteUrl = URLDecoder.decode(serviceUrl);
		if (serviceType == null) {
			return remoteUrl;
		} else if (serviceType.equalsIgnoreCase("WMS")) {
			if (remoteUrl.indexOf("?", 0) > -1)
				remoteUrl = remoteUrl.substring(0, remoteUrl.indexOf("?", 0));
			remoteUrl += "?service=WMS&request=GetCapabilities";
		} else if (remoteUrl.equalsIgnoreCase("WFS")) {
			if (remoteUrl.indexOf("?", 0) > -1)
				remoteUrl = remoteUrl.substring(0, remoteUrl.indexOf("?", 0));
			remoteUrl += "?service=WFS&request=GetCapabilities";
		} else if (remoteUrl.equalsIgnoreCase("WCS")) {
			if (remoteUrl.indexOf("?", 0) > -1)
				remoteUrl = remoteUrl.substring(0, remoteUrl.indexOf("?", 0));
			remoteUrl += "?service=WCS&request=GetCapabilities";
		}
		return remoteUrl;
	}

	public static void main(String[] args) {
		Dispatcher dispather = new Dispatcher();
		System.out
				.println(dispather
						.getKmzContents("http://kml-samples.googlecode.com/svn/trunk/kml/time/time-stamp-point.kmz"));
	}
}
