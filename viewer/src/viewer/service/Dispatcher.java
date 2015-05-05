package viewer.service;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
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
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.log4j.Logger;

@Path("/")
@Produces("application/xml;charset=UTF-8")
public class Dispatcher {
	static final Logger LOGGER = Logger.getLogger(Dispatcher.class);

	@GET
	public String getRequest(@QueryParam("serviceType") String serviceType,
			@QueryParam("serviceUrl") String serviceUrl) throws IOException {
		String remoteUrl = formatUrl(serviceUrl, serviceType);
		String result = "";
		HttpClient httpClient = new DefaultHttpClient();
		try {
			HttpGet httpGetRequest = new HttpGet(remoteUrl);

			HttpResponse httpResponse = httpClient.execute(httpGetRequest);

			LOGGER.info(remoteUrl + " - " + serviceType
					+ httpResponse.getStatusLine());

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
		return result;

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

	private String kmzToKml(String kmzUrl) {
		String kmlDoc = "";

		try {
			URL url = new URL(kmzUrl);
			HttpURLConnection http = (HttpURLConnection) url.openConnection();
			InputStream fin = http.getInputStream();
			ZipInputStream zin = new ZipInputStream(fin);

			ZipInputStream inStream = zin;
			ByteArrayOutputStream outStream = new ByteArrayOutputStream();

			ZipEntry entry;
			byte[] buffer = new byte[1024];
			int nrBytesRead;

			if ((entry = inStream.getNextEntry()) != null) {
				while ((nrBytesRead = inStream.read(buffer)) > 0) {
					outStream.write(buffer, 0, nrBytesRead);
				}
			}

			kmlDoc = outStream.toString();

			outStream.close();
			inStream.close();

		} catch (IOException ex) {
			ex.printStackTrace();
		}

		// TODO: transform
		return kmlDoc;
	}
}
