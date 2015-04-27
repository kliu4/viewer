package Viewer;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;


/**
 * Servlet implementation class kmztokml
 */
public class Kmztokml extends HttpServlet {
	private static final long serialVersionUID = 1L;
	static final Logger LOGGER = Logger.getLogger(Kmztokml.class);
    /**
     * @see HttpServlet#HttpServlet()
     */
    public Kmztokml() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		if(request.getParameter("url")!=null){
			String kmzUrl= request.getParameter("url").toString();
			kmzUrl = URLDecoder.decode(kmzUrl);
			kmzUrl=kmzUrl.replace("[", "%5B").replace("]", "%5D");
			LOGGER.info("convert kmz to kml: " + kmzUrl);
			String kmlStr = this.kmzToKml(kmzUrl);
			
			//System.out.println(kmlStr);

			response.setContentType("text/xml");
			PrintWriter out = response.getWriter();
			out.write(kmlStr);
			out.close();
			LOGGER.debug(kmlStr);
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}
	
	private String kmzToKml(String kmzUrl){
		String kmlDoc="";
	    
        try {
        	
		URL url = new URL(kmzUrl);
	    HttpURLConnection http =(HttpURLConnection)url.openConnection();
	    InputStream fin = http.getInputStream();
		ZipInputStream zin = new ZipInputStream(fin);
			
	                
            //Create input and output streams
            ZipInputStream inStream = zin; //new ZipInputStream(new FileInputStream(zipFileName));
           // OutputStream outStream = new FileOutputStream(extractedFileName);
            ByteArrayOutputStream outStream = new ByteArrayOutputStream();
            
            ZipEntry entry;
            byte[] buffer = new byte[1024];
            int nrBytesRead;
            
            //Get next zip entry and start reading data
            if ((entry = inStream.getNextEntry()) != null) {
                while ((nrBytesRead = inStream.read(buffer)) > 0) {
                    outStream.write(buffer, 0, nrBytesRead);
                }
            }
            
            kmlDoc = outStream.toString();
                    
            //Finish off by closing the streams
            outStream.close();
            inStream.close();
            
        } catch (IOException ex) {
            ex.printStackTrace();
        }
				        
		//TODO: transform
		return kmlDoc;
	}
	
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Kmztokml toKml = new Kmztokml();
		String kmlDoc = toKml.kmzToKml("https://sites.google.com/site/geined13/tours/080505-__USGS_Real-time_Earthquakes_%5B73112%5D.kmz?attredirects=0&d=1");
		System.out.println(kmlDoc);
	}

}
