import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';

const JobCard = ({ job }) => {
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        try {
            const res = await axios.put(
                `${JOB_API_END_POINT}/user/save/${job._id}`,
                {},
                { withCredentials: true }
            );
            if (res.data.success) {
                setIsSaved(true);
            } else {
                alert(res.data.message || "Couldn't save job.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving job.");
        }
    };

    return (
        <div className="border p-4 rounded-md shadow-md bg-white mb-4">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-gray-600">{job.company?.name || 'Unknown Company'}</p>
            <p className="text-sm text-gray-500">{job.location}</p>
            <p className="mt-2 text-gray-700">{job.description?.slice(0, 100)}...</p>

            <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {job.position}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {job.jobType}
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                    {job.salary}
                </span>
            </div>

            <div className="mt-4 flex gap-4">
                <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                    Details
                </button>

                {!isSaved ? (
                    <button
                        onClick={handleSave}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded"
                    >
                        Save for Later
                    </button>
                ) : (
                    <span className="text-green-600 font-medium self-center">✔ Saved</span>
                )}
            </div>
        </div>
    );
};

export default JobCard;
