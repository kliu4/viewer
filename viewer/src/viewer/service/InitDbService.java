package viewer.service;

import java.util.Date;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import viewer.entity.RemoteService;
import viewer.repository.RemoteServiceRepository;

@Transactional
@Service
public class InitDbService {
	@Autowired
	private RemoteServiceRepository remoteServiceRepository;
	
	@PostConstruct
	public void init(){
//		RemoteService remoteService = new RemoteService();
//		remoteService.setUrl("http://www.baidu.com");
//		remoteService.setCreatedAt(new Date());
//		remoteServiceRepository.save(remoteService);
//		
//		List<RemoteService> services = remoteServiceRepository.findAll();
//		System.out.println(services.size());
//		for(RemoteService service:services){
//			System.out.println(service.getId());
//			System.out.println(service.getUrl());
//			System.out.println(service.getCreatedAt());
//		}
//		
//		services = remoteServiceRepository.findFirst1ByUrlOrderByCreatedAtAsc("http://www.google.com");
//		System.out.println(services.size());
//		for(RemoteService service:services){
//			System.out.println(service.getId());
//			System.out.println(service.getUrl());
//			System.out.println(service.getCreatedAt());
//		}
//		
//		services = remoteServiceRepository.findFirst1ByUrlOrderByCreatedAtDesc("http://www..com");
//		System.out.println(services.size());
//		for(RemoteService service:services){
//			System.out.println(service.getId());
//			System.out.println(service.getUrl());
//			System.out.println(service.getCreatedAt());
//		}
	}
}
