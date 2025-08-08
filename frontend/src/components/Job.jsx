// import React from 'react';
// import { Button } from './ui/button';
// import { Bookmark } from 'lucide-react';
// import { Avatar, AvatarImage } from './ui/avatar';
// import { Badge } from './ui/badge';
// import { useNavigate } from 'react-router-dom';

// //import { toast } from 'sonner'; from 'react-router-dom'

// const Job = ({job}) => {
//     const navigate = useNavigate();
//     // const jobId = "lsekdhjgdsnfvsdkjf";

//     const daysAgoFunction = (mongodbTime) => {
//         const createdAt = new Date(mongodbTime);
//         const currentTime = new Date();
//         const timeDifference = currentTime - createdAt;
//         return Math.floor(timeDifference/(1000*24*60*60));
//     }
    
//     return (
//         <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100'>
//             <div className='flex items-center justify-between'>
//                 <p className='text-sm text-gray-500'>{daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}</p>
//                 <Button variant="outline" className="rounded-full" size="icon"><Bookmark /></Button>
//             </div>

//             <div className='flex items-center gap-2 my-2'>
//                 <Button className="p-6" variant="outline" size="icon">
//                     <Avatar>
//                         <AvatarImage src={job?.company?.logo} />
//                     </Avatar>
//                 </Button>
//                 <div>
//                     <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
//                     <p className='text-sm text-gray-500'>India</p>
//                 </div>
//             </div>

//             <div>
//                 <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
//                 <p className='text-sm text-gray-600'>{job?.description}</p>
//             </div>
//             <div className='flex items-center gap-2 mt-4'>
//                 <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} Positions</Badge>
//                 <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
//                 <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{job?.salary}LPA</Badge>
//             </div>
//             <div className='flex items-center gap-4 mt-4'>
//                 <Button onClick={()=> navigate(`/description/${job?._id}`)} variant="outline">Details</Button>
//                 <Button className="bg-[#7209b7]">Save For Later</Button>
//             </div>
//         </div>
//     )
// }

// export default Job


import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Avatar, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';

const Job = ({ job, savedJobIds = [] }) => {
  
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);


    useEffect(() => {
    if (savedJobIds.includes(job._id)) {
      setIsSaved(true);
    }
  }, [savedJobIds, job._id]);


      const handleSaveJob = async () => {
    try {
      if (isSaved) {
        await axios.delete(`${JOB_API_END_POINT}/unsave/${job._id}`, { withCredentials: true });
        toast.info('Job removed from saved list');
      } else {
        await axios.post(`${JOB_API_END_POINT}/save/${job._id}`, {}, { withCredentials: true });
        toast.success('Job saved!');
      }
      setIsSaved(!isSaved);
    } catch (err) {
      toast.error('Action failed. Are you logged in?');
      console.log(err);
    }
  };






  const daysAgoFunction = (mongodbTime) => {
    const createdAt = new Date(mongodbTime);
    const currentTime = new Date();
    const timeDifference = currentTime - createdAt;
    return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  };



  return (
    <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-gray-500'>
          {daysAgoFunction(job?.createdAt) === 0
            ? 'Today'
            : `${daysAgoFunction(job?.createdAt)} days ago`}
        </p>

        {/* 🔖 Bookmark Icon */}
        <Button
          variant='outline'
          className='rounded-full'
          size='icon'
          onClick={handleSaveJob}
        >
          {isSaved ? (
            <BookmarkCheck className='text-purple-700' />
          ) : (
            <Bookmark />
          )}
        </Button>
      </div>

      {/* Company Info */}
      <div className='flex items-center gap-2 my-2'>
        <Button className='p-6' variant='outline' size='icon'>
          <Avatar>
            <AvatarImage src={job?.company?.logo} />
          </Avatar>
        </Button>
        <div>
          <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
          <p className='text-sm text-gray-500'>India</p>
        </div>
      </div>

      {/* Job Info */}
      <div>
        <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
        <p className='text-sm text-gray-600'>{job?.description}</p>
      </div>

      {/* Badges */}
      <div className='flex items-center gap-2 mt-4'>
        <Badge className='text-blue-700 font-bold' variant='ghost'>
          {job?.position} Positions
        </Badge>
        <Badge className='text-[#F83002] font-bold' variant='ghost'>
          {job?.jobType}
        </Badge>
        <Badge className='text-[#7209b7] font-bold' variant='ghost'>
          {job?.salary}LPA
        </Badge>
      </div>

      {/* Buttons */}
      <div className='flex items-center gap-4 mt-4'>
        <Button
          onClick={() => navigate(`/description/${job?._id}`)}
          variant='outline'
        >
          Details
        </Button>
        <Button
          className='bg-[#7209b7]'
          onClick={handleSaveJob}
          disabled={isSaved}
        >
          {isSaved ? 'Saved' : 'Save For Later'}
        </Button>
      </div>
    </div>
  );
};

export default Job;



// ✅ PropTypes validation to remove ESLint wa
