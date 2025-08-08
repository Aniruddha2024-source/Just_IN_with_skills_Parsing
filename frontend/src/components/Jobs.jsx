// import React, { useEffect, useState } from 'react'
// import Navbar from './shared/Navbar'
// import FilterCard from './FilterCard'
// import Job from './Job';
// import { useSelector } from 'react-redux';
// import { motion } from 'framer-motion';

// // const jobsArray = [1, 2, 3, 4, 5, 6, 7, 8];

// const Jobs = () => {
//     const { allJobs, searchedQuery } = useSelector(store => store.job);
//     const [filterJobs, setFilterJobs] = useState(allJobs);

//     useEffect(() => {
//         if (searchedQuery) {
//             const filteredJobs = allJobs.filter((job) => {
//                 return job.title.toLowerCase().includes(searchedQuery.toLowerCase()) ||
//                     job.description.toLowerCase().includes(searchedQuery.toLowerCase()) ||
//                     job.location.toLowerCase().includes(searchedQuery.toLowerCase())
//             })
//             setFilterJobs(filteredJobs)
//         } else {
//             setFilterJobs(allJobs)
//         }
//     }, [allJobs, searchedQuery]);

//     return (
//         <div>
//             <Navbar />
//             <div className='max-w-7xl mx-auto mt-5'>
//                 <div className='flex gap-5'>
//                     <div className='w-20%'>
//                         <FilterCard />
//                     </div>
//                     {
//                         filterJobs.length <= 0 ? <span>Job not found</span> : (
//                             <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
//                                 <div className='grid grid-cols-3 gap-4'>
//                                     {
//                                         filterJobs.map((job) => (
//                                             <motion.div
//                                                 initial={{ opacity: 0, x: 100 }}
//                                                 animate={{ opacity: 1, x: 0 }}
//                                                 exit={{ opacity: 0, x: -100 }}
//                                                 transition={{ duration: 0.3 }}
//                                                 key={job?._id}>
//                                                 <Job job={job} />
//                                             </motion.div>
//                                         ))
//                                     }
//                                 </div>
//                             </div>
//                         )
//                     }
//                 </div>
//             </div>


//         </div>
//     )
// }

// export default Jobs



// import React, { useEffect, useState } from 'react'
// import Navbar from './shared/Navbar'
// import FilterCard from './FilterCard'
// import Job from './Job';
// import { useSelector } from 'react-redux';
// import { motion } from 'framer-motion';

// const Jobs = () => {
//     const { allJobs, searchedQuery } = useSelector(store => store.job);
//     const [filterJobs, setFilterJobs] = useState(allJobs);
    

//     useEffect(() => {
//         if (searchedQuery) {
//             const lowerCaseQuery = searchedQuery.toLowerCase();

//             const filteredJobs = allJobs.filter((job) => {
//                 // ✅ Salary Filter: "0-4LPA", "4LPA-8LPA", "8LPA to 10LPA"
//                 if (lowerCaseQuery.includes("lpa")) {
//                     const clean = lowerCaseQuery.replace(/lpa/g, "").replace(/\s/g, "");
//                     let [minStr, maxStr] = clean.split("-");
//                     const min = parseFloat(minStr);
//                     const max = parseFloat(maxStr);

//                     return job.salary >= min && job.salary <= max;
//                 }

//                 // ✅ Location, Title, or Description
//                 return (
//                     job.title?.toLowerCase().includes(lowerCaseQuery) ||
//                     job.description?.toLowerCase().includes(lowerCaseQuery) ||
//                     job.location?.toLowerCase().includes(lowerCaseQuery)
//                 );
//             });

//             setFilterJobs(filteredJobs);
//         } else {
//             setFilterJobs(allJobs);
//         }
//     }, [allJobs, searchedQuery]);

//     return (
//         <div>
//             <Navbar />
//             <div className='max-w-7xl mx-auto mt-5'>
//                 <div className='flex gap-5'>
//                     <div className='w-20%'>
//                         <FilterCard />
//                     </div>
//                     {
//                         filterJobs.length <= 0 ? <span>Job not found</span> : (
//                             <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
//                                 <div className='grid grid-cols-3 gap-4'>
//                                     {
//                                         filterJobs.map((job) => (
//                                             <motion.div
//                                                 initial={{ opacity: 0, x: 100 }}
//                                                 animate={{ opacity: 1, x: 0 }}
//                                                 exit={{ opacity: 0, x: -100 }}
//                                                 transition={{ duration: 0.3 }}
//                                                 key={job?._id}>
//                                                 <Job job={job} />
//                                             </motion.div>
//                                         ))
//                                     }
//                                 </div>
//                             </div>
//                         )
//                     }
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default Jobs;

import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import FilterCard from './FilterCard';
import Job from './Job';
import { useDispatch,useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';
import { setAllJobs } from '@/redux/jobSlice'; 
import { useSearchParams } from 'react-router-dom';

const Jobs = () => {
  const dispatch = useDispatch();
  //const { allJobs, searchedQuery } = useSelector(store => store.job);
  const { allJobs } = useSelector(store => store.job);
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || '';
  const locationParam = searchParams.get("location") || '';
  const salaryParam = searchParams.get("salary") || '';
  const [filterJobs, setFilterJobs] = useState(allJobs);
  const [savedJobIds, setSavedJobIds] = useState([]);

// Optionally, you can fetch jobs from the backend with filters, but for now, just fetch all jobs once
useEffect(() => {
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${JOB_API_END_POINT}/get`);
      dispatch(setAllJobs(res.data.jobs));
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };
  fetchJobs();
}, [dispatch]);





  useEffect(() => {
    const fetchSavedJobIds = async () => {
      try {
        const res = await axios.get(`${JOB_API_END_POINT}/saved`, { withCredentials: true });
        const ids = res.data.savedJobs.map(job => job._id);
        setSavedJobIds(ids);
      } catch (err) {
        console.log("Failed to load saved jobs", err);
      }
    };
    fetchSavedJobIds();
  }, []);

  useEffect(() => {
    let filtered = allJobs;

    if (roleParam) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(roleParam.toLowerCase())
      );
    }
    if (locationParam) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(locationParam.toLowerCase())
      );
    }
    if (salaryParam) {
      // Expecting salaryParam like "4-8 LPA" or "8-15 LPA" or "15+ LPA"
      let min = 0, max = Infinity;
      const match = salaryParam.match(/(\d+)(?:-(\d+))?/);
      if (match) {
        min = parseFloat(match[1]);
        if (match[2]) {
          max = parseFloat(match[2]);
        } else if (salaryParam.includes('+')) {
          max = Infinity;
        }
      }
      filtered = filtered.filter(job => {
        // Assume job.salary is in LPA (number)
        return job.salary >= min && job.salary <= max;
      });
    }
    setFilterJobs(filtered);
  }, [allJobs, roleParam, locationParam, salaryParam]);

  return (
    <div>
      <Navbar />
      <div className='max-w-7xl mx-auto mt-5'>
        <div className='flex gap-5'>
          <div className='w-20%'>
            <FilterCard />
          </div>
          {
            filterJobs.length <= 0 ? <span>Job not found</span> : (
              <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
                <div className='grid grid-cols-3 gap-4'>
                  {
                    filterJobs.map((job) => (
                      <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        key={job?._id}>
                        <Job job={job} savedJobIds={savedJobIds} />
                      </motion.div>
                    ))
                  }
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default Jobs;

