package Viewer;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.log4j.Logger;

import Viewer.WmcCreateServlet.TempFile;

/**
 * Servlet implementation class LoadWmc
 */
public class LoadWmc extends HttpServlet {
	private static final long serialVersionUID = 1L;
	static final Logger LOGGER = Logger.getLogger(LoadWmc.class);
    protected static final String TEMP_FILE_PREFIX = "Viewer-wmc";
    protected static final String TEMP_FILE_SUFFIX = ".cml";
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public LoadWmc() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// Create a factory for disk-based file items
		System.out.println("post");
		FileItemFactory factory = new DiskFileItemFactory();
		// Create a new file upload handler
		
        ServletFileUpload upload = new ServletFileUpload(factory);
     // Set overall request size constraint
        final PrintWriter out = response.getWriter();
        response.setContentType("text/html");
        response.setHeader("Cache-Control", "no-cache");

        boolean isMultipart = ServletFileUpload.isMultipartContent(request);

        if (!isMultipart) {
            out.write("{success: false, error: 'Error loading WMC'}");
            out.flush();

            return;
        }
        
        ServletContext servletContext = getServletContext();
  	  	String contextPath = servletContext.getRealPath(File.separator);
        File dir = new File(contextPath+"/tmp/");
        System.out.println(dir);
        // Parse the request
        List items = null;
		try {
			items = upload.parseRequest(request);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		// Process the uploaded items
        Iterator iter = items.iterator();
		while (iter.hasNext()) {
            FileItem item = (FileItem) iter.next();

            if (!item.isFormField()) {
                byte[] data = item.get();
                
                //create a temporary file that will contain the WMC
                TempFile tempFile = new TempFile(File.createTempFile(TEMP_FILE_PREFIX, TEMP_FILE_SUFFIX, dir));
                //final String id = generateId(tempFile);
                System.out.println(dir);
                try {
                    FileWriter fw = new FileWriter(tempFile);
                    fw.write(new String(data));
                    fw.close();
                    
                    out.write("{success: true, url: 'tmp/"  + tempFile.getName() + "'}");

                } catch (IOException e) {
//                    deleteFile(tempFile);
                    out.write("{success: false, error: '" + e.getMessage() + "'}");

                }
                
                
                break;
            }
        }
	}

}
