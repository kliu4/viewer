package viewer.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

//save the id and url in the database
//xml contents of remote service may be big, save the contents in the file system
@Entity
public class RemoteService {
	
	@Id
	@GeneratedValue
	private Integer id;

	private String url;
	
	private String content;
	
	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}
	
}
