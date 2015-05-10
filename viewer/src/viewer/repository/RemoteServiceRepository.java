package viewer.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import viewer.entity.RemoteService;

public interface RemoteServiceRepository extends JpaRepository<RemoteService, String>{
	List<RemoteService> findByUrl(String url);
	List<RemoteService> findFirst1ByUrlOrderByCreatedAtAsc(String url);
	List<RemoteService> findFirst1ByUrlOrderByCreatedAtDesc(String url);
}
