import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';
import { useParams, useNavigate } from 'react-router-dom';

const EditJob = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        requirements: '',
        salary: '',
        experience: '',
        location: '',
        jobType: '',
        position: '',
        companyId: ''
    });

    const [message, setMessage] = useState(''); // ✅ Add this
    const [error, setError] = useState('');     // ✅ For error message

    useEffect(() => {
    const fetchJob = async () => {
        try {
            const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, {
                withCredentials: true
            });
            if (res.data.success) {
                const job = res.data.job;
                setJobData({
                    title: job.title,
                    description: job.description,
                    requirements: job.requirements.join(', '),
                    salary: job.salary,
                    experience: job.experienceLevel,
                    location: job.location,
                    jobType: job.jobType,
                    position: job.position,
                    companyId: typeof job.company === 'object' ? job.company._id : job.company // ✅ FIX HERE
                });
            }
        } catch (err) {
            console.log(err);
        }
    };
    fetchJob();
}, [jobId]);

    const handleChange = (e) => {
        setJobData({ ...jobData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${JOB_API_END_POINT}/update/${jobId}`, {
                title: jobData.title,
                description: jobData.description,
                requirements: jobData.requirements.split(',').map(item => item.trim()),
                salary: jobData.salary,
                experienceLevel: jobData.experience,
                location: jobData.location,
                jobType: jobData.jobType,
                position: jobData.position,
                company: jobData.companyId
            }, {
                withCredentials: true
            });

            setMessage('✅ Job updated successfully!');
            setError('');

            // Optional: redirect after 1.5s
            setTimeout(() => {
                navigate('/admin/jobs');
            }, 1500);
        } catch (err) {
            console.log(err);
            setError('❌ Failed to update job. Please check the inputs.');
            setMessage('');
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-4">Edit Job</h1>

            {/* ✅ Message UI */}
            {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="title" value={jobData.title} onChange={handleChange} placeholder="Title" className="w-full border p-2" />
                <textarea name="description" value={jobData.description} onChange={handleChange} placeholder="Description" className="w-full border p-2" />
                <input name="requirements" value={jobData.requirements} onChange={handleChange} placeholder="Requirements (comma separated)" className="w-full border p-2" />
                <input name="salary" value={jobData.salary} onChange={handleChange} placeholder="Salary" className="w-full border p-2" />
                <input name="experience" value={jobData.experience} onChange={handleChange} placeholder="Experience" className="w-full border p-2" />
                <input name="location" value={jobData.location} onChange={handleChange} placeholder="Location" className="w-full border p-2" />
                <input name="jobType" value={jobData.jobType} onChange={handleChange} placeholder="Job Type" className="w-full border p-2" />
                <input name="position" value={jobData.position} onChange={handleChange} placeholder="Position" className="w-full border p-2" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2">Update Job</button>
            </form>
        </div>
    );
};

export default EditJob;