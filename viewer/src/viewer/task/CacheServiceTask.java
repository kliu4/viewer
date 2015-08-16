package viewer.task;

import org.springframework.beans.factory.annotation.Autowired;

import viewer.service.DbService;

public class CacheServiceTask {
	@Autowired
	private DbService service;
	
	public void run(){
		System.out.println("task");
	}
	
	
}
