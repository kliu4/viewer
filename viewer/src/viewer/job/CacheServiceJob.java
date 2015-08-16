package viewer.job;

import org.quartz.InterruptableJob;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.UnableToInterruptJobException;

import viewer.task.CacheServiceTask;

public class CacheServiceJob implements InterruptableJob{

	/* (non-Javadoc)
	 * @see org.quartz.Job#execute(org.quartz.JobExecutionContext)
	 */
	@Override
	public void execute(JobExecutionContext arg0) throws JobExecutionException {
		// TODO Auto-generated method stub
		CacheServiceTask task = new CacheServiceTask();
		task.run();
	}

	/* (non-Javadoc)
	 * @see org.quartz.InterruptableJob#interrupt()
	 */
	@Override
	public void interrupt() throws UnableToInterruptJobException {
		// TODO Auto-generated method stub
		
	}
	
}

