package Viewer;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.Enumeration;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

/**
 * Servlet implementation class GetRemoteService
 */
public class GetRemoteService extends HttpServlet {
	private static final long serialVersionUID = 1L;
	static final Logger LOGGER = Logger.getLogger(GetRemoteService.class);

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public GetRemoteService() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */

	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String serviceurl = request.getParameterValues("url")[0];
		String serviceurlDecoder = URLDecoder.decode(serviceurl);
		String servicetype = request.getParameterValues("servicetype")[0];
		if (servicetype.equalsIgnoreCase("WMS")) {
			if (serviceurlDecoder.indexOf("?", 0) > -1)
				serviceurl = serviceurlDecoder.substring(0,
						serviceurlDecoder.indexOf("?", 0));
			serviceurl += "?service=WMS&request=GetCapabilities";
		} else if (servicetype.equalsIgnoreCase("WFS")) {
			if (serviceurlDecoder.indexOf("?", 0) > -1)
				serviceurl = serviceurlDecoder.substring(0,
						serviceurlDecoder.indexOf("?", 0));
			serviceurl += "?service=WFS&request=GetCapabilities";
		} else if (servicetype.equalsIgnoreCase("WCS")) {
			if (serviceurlDecoder.indexOf("?", 0) > -1)
				serviceurl = serviceurlDecoder.substring(0,
						serviceurlDecoder.indexOf("?", 0));
			serviceurl += "?service=WCS&request=GetCapabilities";
		}
		LOGGER.info("Get Remote Service: " + serviceurl);
		URL url = new URL(serviceurl);
		URLConnection conn = url.openConnection();
		// Get the response
		BufferedReader rd = new BufferedReader(new InputStreamReader(
				conn.getInputStream()));
		StringBuffer sb = new StringBuffer();

		char[] charBuffer = new char[1024];
		int count = 0;
		do {
			count = rd.read(charBuffer, 0, 1024);
			if (count >= 0)
				sb.append(charBuffer, 0, count);
		} while (count > 0);

		String result = sb.toString();
		response.setContentType("text/xml");
		PrintWriter out = response.getWriter();
		out.print(result);
		out.flush();
		out.close();
		rd.close();
		LOGGER.debug(result);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

	}

}
