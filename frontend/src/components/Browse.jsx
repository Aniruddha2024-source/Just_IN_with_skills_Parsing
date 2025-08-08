/*import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import useGetAllJobs from '@/hooks/useGetAllJobs';

// const randomJobs = [1, 2,45];

const Browse = () => {
    useGetAllJobs();
    const {allJobs} = useSelector(store=>store.job);
    const dispatch = useDispatch();
    useEffect(()=>{
        return ()=>{
            dispatch(setSearchedQuery(""));
        }
    },[])
    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10'>
                <h1 className='font-bold text-xl my-10'>Search Results ({allJobs.length})</h1>
                <div className='grid grid-cols-3 gap-4'>
                    {
                        allJobs.map((job) => {
                            return (
                                <Job key={job._id} job={job}/>
                            )
                        })
                    }
                </div>

            </div>
        </div>
    )
}

export default Browse;*/



// Browse.jsx
/*import React, { useEffect } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { setSearchedQuery } from '@/redux/jobSlice';




const Browse = () => {
    

    const dispatch = useDispatch();
    const { allJobs } = useSelector(store => store.job);

    // 🔍 Get ?q= from URL
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get("q") || "";

    console.log("🔍 Search Query from URL:", searchQuery);

    // 🟢 Fetch jobs using the searchQuery from URL
    useGetAllJobs(searchQuery);

    useEffect(() => {
        return () => {
            dispatch(setSearchedQuery(""));
        }
    }, []);

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10'>
                <h1 className='font-bold text-xl my-10'>Search Results ({allJobs.length})</h1>
                <div className='grid grid-cols-3 gap-4'>
                    {allJobs.map(job => (
                        <Job key={job._id} job={job} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Browse;*/

// import React, { useEffect } from 'react';
// import Navbar from './shared/Navbar';
// import Job from './Job';
// import { useSelector, useDispatch } from 'react-redux';
// import { useLocation } from 'react-router-dom';
// import { setSearchedQuery, setAllJobs } from '@/redux/jobSlice';
// import axios from 'axios';
// import { JOB_API_END_POINT } from '@/utils/constant';

// const Browse = () => {
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const { allJobs } = useSelector(store => store.job);

//   // ✅ Step 1: Get query from URL like ?q=developer
//   const query = new URLSearchParams(location.search).get('q') || '';

//   useEffect(() => {
//     // ✅ Step 2: Set it to Redux
//     dispatch(setSearchedQuery(query));

//     // ✅ Step 3: Fetch jobs using this query
//     const fetchJobs = async () => {
//       try {
//         const res = await axios.get(`${JOB_API_END_POINT}/get?keyword=${query}`, {
//           withCredentials: true
//         });
//         if (res.data.success) {
//           dispatch(setAllJobs(res.data.jobs));
//         }
//       } catch (err) {
//         console.log("Fetch error:", err);
//       }
//     };

//     fetchJobs();
//   }, [query, dispatch]);

//   return (
//     <div>
//       <Navbar />
//       <div className='max-w-7xl mx-auto my-10'>
//         <h1 className='font-bold text-xl my-10'>Search Results ({allJobs.length})</h1>
//         <div className='grid grid-cols-3 gap-4'>
//           {allJobs.map((job) => (
//             <Job key={job._id} job={job} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Browse;


import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setSearchedQuery, setAllJobs } from '@/redux/jobSlice';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';

const Browse = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { allJobs } = useSelector(store => store.job);
  const [savedJobIds, setSavedJobIds] = useState([]);

  // ✅ Step 1: Get role from URL like ?role=developer
  const roleParam = new URLSearchParams(location.search).get('role') || '';

  useEffect(() => {
    dispatch(setSearchedQuery(roleParam));

    const fetchJobsAndSaved = async () => {
      try {
        const [jobsRes, savedRes] = await Promise.all([
          axios.get(`${JOB_API_END_POINT}/get`),
          axios.get(`${JOB_API_END_POINT}/saved`, { withCredentials: true })
        ]);

        let jobs = jobsRes.data.jobs || [];
        // Filter jobs by role if roleParam exists
        if (roleParam) {
          jobs = jobs.filter(job =>
            job.title?.toLowerCase().includes(roleParam.toLowerCase())
          );
        }
        dispatch(setAllJobs(jobs));

        const ids = savedRes.data.savedJobs.map(job => job._id);
        setSavedJobIds(ids);
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    fetchJobsAndSaved();
  }, [roleParam, dispatch]);

  return (
    <div>
      <Navbar />
      <div className='max-w-7xl mx-auto my-10'>
        <h1 className='font-bold text-xl my-10'>Search Results ({allJobs.length})</h1>
        <div className='grid grid-cols-3 gap-4'>
          {allJobs.map((job) => (
            <Job key={job._id} job={job} savedJobIds={savedJobIds} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Browse;










