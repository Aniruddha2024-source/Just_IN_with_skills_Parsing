import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MoreHorizontal, User, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import axios from 'axios';
import { CardSwipe } from '../ui/card-swipe';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const shortlistingStatus = ["Accepted", "Rejected"];

const ApplicantsTable = () => {
    const { applicants } = useSelector(store => store.application);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'accepted', 'rejected', 'pending'
    const [localApplications, setLocalApplications] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Update local applications whenever the Redux state changes
    useEffect(() => {
        if (applicants && applicants.applications) {
            setLocalApplications([...applicants.applications]);
        }
    }, [applicants]);
    
    const statusHandler = async (status, id) => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${APPLICATION_API_END_POINT}/status/${id}/update`, { status });
            
            if (res.data.success) {
                // Update local state immediately for better UX
                setLocalApplications(prev => prev.map(app => 
                    app._id === id ? { ...app, status } : app
                ));
                
                toast.success(res.data.message);
                
                // Reset current index if we're viewing filtered applications
                // to prevent index out of bounds
                if (activeFilter !== 'all') {
                    setCurrentIndex(0);
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error updating status');
        }
    };
    
    // Filter applications based on status - using local state now
    const getFilteredApplications = useCallback(() => {
        if (!localApplications || localApplications.length === 0) return [];
        
        if (activeFilter === 'all') return localApplications;
        if (activeFilter === 'pending') return localApplications.filter(app => 
            !app.status || 
            (app.status && app.status.toLowerCase() === 'pending')
        );
        
        return localApplications;
    }, [localApplications, activeFilter]);
    
    // Memoize the pending application count to prevent recalculations
    const pendingCount = useMemo(() => 
        localApplications.filter(app => 
            !app.status || 
            (app.status && app.status.toLowerCase() === 'pending')
        ).length, 
    [localApplications]);

    // Reset current index when filter changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeFilter]);

    const renderApplicantCard = (item) => {
        // Determine status-specific styles
        let statusBorderClass = "";
        let statusIconClass = "";
        
        const normalizedStatus = item.status ? item.status.toLowerCase() : '';
        
        if (normalizedStatus === 'accepted') {
            statusBorderClass = "border-t-4 border-green-500";
            statusIconClass = "bg-green-100 text-green-800";
        } else if (normalizedStatus === 'rejected') {
            statusBorderClass = "border-t-4 border-red-500";
            statusIconClass = "bg-red-100 text-red-800";
        } else {
            statusBorderClass = "border-t-4 border-blue-500";
            statusIconClass = "bg-blue-100 text-blue-800";
        }
        
        return (
            <div className={`p-6 flex flex-col h-full ${statusBorderClass}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">{item?.applicant?.fullname}</h3>
                    <Badge className={statusIconClass}>
                        {item.status || 'Pending'}
                    </Badge>
                </div>

                <div className="flex-1 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <User className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-lg">Applicant Details</span>
                        </div>
                        
                        <div className="ml-8 space-y-3">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-base">{item?.applicant?.email}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-base">{item?.applicant?.phoneNumber || 'Not provided'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-base">Applied on: {item?.applicant?.createdAt.split("T")[0]}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-lg">Resume</span>
                        </div>
                        
                        <div className="ml-8 mt-2">
                            {item.applicant?.profile?.resume ? (
                                <a 
                                    className="text-blue-600 flex items-center gap-2 hover:underline py-1 px-3 bg-blue-50 rounded-md transition-colors hover:bg-blue-100" 
                                    href={item?.applicant?.profile?.resume} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <FileText className="h-4 w-4" />
                                    {item?.applicant?.profile?.resumeOriginalName || 'View Resume'}
                                </a>
                            ) : (
                                <span className="text-gray-500 py-1 px-3 bg-gray-50 rounded-md">No resume provided</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Status is already shown at the top, so no need to repeat at bottom */}
                </div>
            </div>
        );
    };

    // If there are no applicants or applications
    if (!applicants || !applicants.applications || applicants.applications.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-medium text-gray-600">No applicants yet</h3>
                <p className="text-gray-500 mt-2">When candidates apply for this position, they&apos;ll appear here.</p>
            </div>
        );
    }

    // Add buttons to the card for accepting/rejecting
    const renderCardWithActions = (item) => {
        // If the item is pending, show action buttons within the card
        if (!item.status || (item.status && item.status.toLowerCase() === 'pending')) {
            return (
                <div className="p-6 flex flex-col h-full border-t-4 border-blue-500">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold">{item?.applicant?.fullname}</h3>
                        <Badge className="bg-blue-100 text-blue-800">
                            Pending
                        </Badge>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <User className="h-5 w-5 text-gray-500" />
                                <span className="font-medium text-lg">Applicant Details</span>
                            </div>
                            
                            <div className="ml-8 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-base">{item?.applicant?.email}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="text-base">{item?.applicant?.phoneNumber || 'Not provided'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-base">Applied on: {item?.applicant?.createdAt.split("T")[0]}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span className="font-medium text-lg">Resume</span>
                            </div>
                            
                            <div className="ml-8 mt-2">
                                {item.applicant?.profile?.resume ? (
                                    <a 
                                        className="text-blue-600 flex items-center gap-2 hover:underline py-1 px-3 bg-blue-50 rounded-md transition-colors hover:bg-blue-100" 
                                        href={item?.applicant?.profile?.resume} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <FileText className="h-4 w-4" />
                                        {item?.applicant?.profile?.resumeOriginalName || 'View Resume'}
                                    </a>
                                ) : (
                                    <span className="text-gray-500 py-1 px-3 bg-gray-50 rounded-md">No resume provided</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="mt-8 flex justify-center gap-4 pb-6">
                            <button
                                onClick={() => statusHandler('Rejected', item._id)}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all hover:shadow-lg"
                            >
                                Reject Application
                            </button>
                            <button
                                onClick={() => statusHandler('Accepted', item._id)}
                                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all hover:shadow-lg"
                            >
                                Accept Application
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Otherwise, use the standard card
        return renderApplicantCard(item);
    };
    

    
    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold">Application Reviews</h2>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={viewMode === 'card' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('card')}
                    >
                        Card View
                    </Button>
                    <Button 
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                    >
                        Table View
                    </Button>
                </div>
            </div>
            
            {viewMode === 'card' ? (
                <div>
                    <div className="mb-6 flex justify-center gap-3">
                        <Button 
                            variant={activeFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('all')}
                        >
                            All ({localApplications.length})
                        </Button>
                        <Button 
                            variant={activeFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveFilter('pending')}
                        >
                            Pending ({pendingCount})
                        </Button>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                        <div className="mb-4">
                            <h3 className={`text-lg font-medium mb-4 border-b pb-2 text-center
                                ${activeFilter === 'pending' ? 'text-blue-600' : 'text-blue-600'}`}>
                                {activeFilter === 'pending' ? 'Pending Applications' : 'All Applications'}
                            </h3>
                            
                            {getFilteredApplications().length > 0 ? (
                                <CardSwipe 
                                    items={getFilteredApplications()}
                                    renderItem={renderCardWithActions}
                                    onIndexChange={(newIndex) => setCurrentIndex(newIndex)}
                                    key={`card-swipe-${activeFilter}-${getFilteredApplications().length}`}
                                />
                            ) : (
                                <div className="flex justify-center items-center h-[300px]">
                                    <p className="text-gray-500">No {activeFilter === 'pending' ? 'pending' : ''} applications</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <Table>
                    <TableCaption>A list of your recent applied user</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>FullName</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Resume</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localApplications.map((item) => (
                            <tr key={item._id} className={
                                item.status === 'Accepted' ? 'bg-green-50' :
                                item.status === 'Rejected' ? 'bg-red-50' : ''
                            }>
                                <TableCell>{item?.applicant?.fullname}</TableCell>
                                <TableCell>{item?.applicant?.email}</TableCell>
                                <TableCell>{item?.applicant?.phoneNumber}</TableCell>
                                <TableCell>
                                    {item.status && item.status.toLowerCase() === 'accepted' ? (
                                        <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                                    ) : item.status && item.status.toLowerCase() === 'rejected' ? (
                                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                                    ) : (
                                        <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
                                    )}
                                </TableCell>
                                <TableCell >
                                    {
                                        item.applicant?.profile?.resume ? <a className="text-blue-600 cursor-pointer" href={item?.applicant?.profile?.resume} target="_blank" rel="noopener noreferrer">{item?.applicant?.profile?.resumeOriginalName}</a> : <span>NA</span>
                                    }
                                </TableCell>
                                <TableCell>{item?.applicant.createdAt.split("T")[0]}</TableCell>
                                <TableCell className="float-right cursor-pointer">
                                    <Popover>
                                        <PopoverTrigger>
                                            <MoreHorizontal />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-32">
                                            {
                                                shortlistingStatus.map((status, index) => {
                                                    return (
                                                        <div onClick={() => statusHandler(status, item?._id)} key={index} className='flex w-fit items-center my-2 cursor-pointer'>
                                                            <span>{status}</span>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}

export default ApplicantsTable