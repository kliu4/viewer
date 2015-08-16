package viewer.service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.annotation.PostConstruct;
import javax.transaction.Transactional;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import viewer.entity.RemoteService;
import viewer.repository.RemoteServiceRepository;

@Transactional
@Service
public class DbService {
	@Autowired
	private RemoteServiceRepository remoteServiceRepository;

	@PostConstruct
	public void init() throws IOException {
//		String encoded = FileUtils.readFileToString(new File(
//				"/Users/kailiu/Downloads/coawst.xml"));
//		saveService(
//				"http://geoport-dev.whoi.edu/thredds/wms/coawst_4/use/fmrc/coawst_4_use_best.ncd?service=WMS&request=GetCapabilities",
//				encoded);

		// RemoteService remoteService = new RemoteService();
		// remoteService.setUrl("http://www.baidu.com");
		// remoteService.setCreatedAt(new Date());
		// remoteServiceRepository.save(remoteService);
		//
		// List<RemoteService> services = remoteServiceRepository.findAll();
		// System.out.println(services.size());
		// for(RemoteService service:services){
		// System.out.println(service.getId());
		// System.out.println(service.getUrl());
		// System.out.println(service.getCreatedAt());
		// }
		//
		// services =
		// remoteServiceRepository.findFirst1ByUrlOrderByCreatedAtAsc("http://www.google.com");
		// System.out.println(services.size());
		// for(RemoteService service:services){
		// System.out.println(service.getId());
		// System.out.println(service.getUrl());
		// System.out.println(service.getCreatedAt());
		// }
		//
		// services =
		// remoteServiceRepository.findFirst1ByUrlOrderByCreatedAtDesc("http://www..com");
		// System.out.println(services.size());
		// for(RemoteService service:services){
		// System.out.println(service.getId());
		// System.out.println(service.getUrl());
		// System.out.println(service.getCreatedAt());
		// }
	}

	public void saveService(String url, String contents) {
		try {
			UUID id = saveServiceInFileSystem(contents);
			saveServiceInDb(url, id);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	private void saveServiceInDb(String url, UUID id) {
		RemoteService remoteService = new RemoteService();
		remoteService.setUrl(url);
		remoteService.setCreatedAt(new Date());
		remoteService.setId(id);
		remoteServiceRepository.save(remoteService);
	}

	private UUID saveServiceInFileSystem(String contents)
			throws FileNotFoundException, UnsupportedEncodingException {

		UUID id = UUID.randomUUID();
		File file = new File(System.getProperty("webroot") + "WEB-INF/classes/data/services/" + id);
		file.getParentFile().mkdirs();
		PrintWriter writer = new PrintWriter(file, "UTF-8");
		System.out.println(System.getProperty("webroot") + "WEB-INF/classes/data/services/" + id);
		writer.println(contents);
		writer.close();
		return id;

	}
}
