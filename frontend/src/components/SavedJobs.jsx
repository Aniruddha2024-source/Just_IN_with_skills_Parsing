// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { JOB_API_END_POINT } from '@/utils/constant';

// const SavedJobs = () => {
  
//   const [jobs, setJobs] = useState([]);

//   useEffect(() => {
//     const fetchSavedJobs = async () => {
//       const res = await axios.get(`${JOB_API_END_POINT}/saved`, { withCredentials: true });
//       setJobs(res.data.savedJobs);
//     };

//     fetchSavedJobs();
//   }, []);

//   const handleUnsave = async (jobId) => {
//     await axios.delete(`${JOB_API_END_POINT}/unsave/${jobId}`, { withCredentials: true });
//     setJobs(prev => prev.filter(job => job._id !== jobId));
//   };

//   return (
//     <div className="max-w-4xl mx-auto py-10">
//       <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
//       {jobs.map(job => (
//         <div key={job._id} className="border p-4 mb-4 rounded shadow">
//           <h2 className="text-xl font-semibold">{job.title}</h2>
//           <p>{job.location}</p>
//           <button onClick={() => handleUnsave(job._id)} className="bg-red-500 text-white px-3 py-1 mt-2">Unsave</button>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default SavedJobs;


import { useEffect, useState } from 'react';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';

const SavedJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      const res = await axios.get(`${JOB_API_END_POINT}/saved`, { withCredentials: true });
      setJobs(res.data.savedJobs);
    };

    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId) => {
    await axios.delete(`${JOB_API_END_POINT}/unsave/${jobId}`, { withCredentials: true });
    setJobs(prev => prev.filter(job => job._id !== jobId));
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
      {jobs.length === 0 ? (
        <p>No saved jobs yet.</p>
      ) : (
        jobs.map(job => (
          <div key={job._id} className="border p-4 mb-4 rounded shadow">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p>{job.location}</p>
            <button onClick={() => handleUnsave(job._id)} className="bg-red-500 text-white px-3 py-1 mt-2">Unsave</button>
          </div>
        ))
      )}
    </div>
  );
};

export default SavedJobs;

