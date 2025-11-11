import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarImage } from '../ui/avatar'
import { LogOut, User2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'

const Navbar = () => {
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            if (res.data.success) {
                dispatch(setUser(null));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        }
    }
    return (
        <div className='bg-black border-b border-zinc-800'>
            <div className='flex items-center justify-between mx-auto max-w-7xl h-16 px-4 sm:px-6'>
                <div>
                    <h1 className='text-xl sm:text-2xl font-bold text-white'>Just<span className='text-orange-500'>In</span></h1>
                </div>
                <div className='flex items-center gap-4 sm:gap-12'>
                    <ul className='hidden md:flex font-medium items-center gap-4 lg:gap-8'>
                        {
                            user && user.role === 'recruiter' ? (
                                <>
                                    <li><Link to="/admin/companies" className='text-white hover:text-orange-400 transition-colors duration-200 text-sm lg:text-base'>Companies</Link></li>
                                    <li><Link to="/admin/jobs" className='text-white hover:text-orange-400 transition-colors duration-200 text-sm lg:text-base'>Jobs</Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link to="/" className='text-white hover:text-orange-400 transition-colors duration-200 text-sm lg:text-base'>Home</Link></li>
                                    <li><Link to="/jobs" className='text-white hover:text-orange-400 transition-colors duration-200 text-sm lg:text-base'>Jobs</Link></li>
                                    <li><Link to="/browse" className='text-white hover:text-orange-400 transition-colors duration-200 text-sm lg:text-base'>Browse</Link></li>
                                </>
                            )
                        }
                    </ul>
                    {
                        !user ? (
                            <div className='flex items-center gap-2 sm:gap-3'>
                                <Link to="/login">
                                    <Button 
                                        variant="outline" 
                                        className="border-zinc-700 text-white hover:bg-zinc-800 hover:text-white bg-transparent text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-6 rounded-md font-medium transition-colors duration-200 text-xs sm:text-sm h-8 sm:h-9">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Avatar className="cursor-pointer border-2 border-zinc-700 hover:border-orange-500 transition-colors duration-200 w-8 h-8 sm:w-10 sm:h-10">
                                        <AvatarImage src={user?.profile?.profilePhoto} alt="@shadcn" />
                                    </Avatar>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 sm:w-80 bg-zinc-900 border-zinc-700 mr-4">
                                    <div className=''>
                                        <div className='flex gap-2 space-y-2'>
                                            <Avatar className="cursor-pointer">
                                                <AvatarImage src={user?.profile?.profilePhoto} alt="@shadcn" />
                                            </Avatar>
                                            <div>
                                                <h4 className='font-medium text-white text-sm sm:text-base'>{user?.fullname}</h4>
                                                <p className='text-xs sm:text-sm text-zinc-400'>{user?.profile?.bio}</p>
                                            </div>
                                        </div>
                                        <div className='flex flex-col my-2 text-zinc-300'>
                                            {
                                                user && user.role === 'student' && (
                                                    <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                        <User2 className="text-zinc-400 w-4 h-4" />
                                                        <Button variant="link" className="text-zinc-300 hover:text-orange-400 text-sm p-0"> 
                                                            <Link to="/profile">View Profile</Link>
                                                        </Button>
                                                    </div>
                                                )
                                            }

                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                <LogOut className="text-zinc-400 w-4 h-4" />
                                                <Button 
                                                    onClick={logoutHandler} 
                                                    variant="link" 
                                                    className="text-zinc-300 hover:text-orange-400 text-sm p-0"
                                                >
                                                    Logout
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Mobile Navigation Links */}
                                        <div className='md:hidden border-t border-zinc-700 pt-3 mt-3'>
                                            <div className='flex flex-col space-y-2'>
                                                {
                                                    user && user.role === 'recruiter' ? (
                                                        <>
                                                            <Link to="/admin/companies" className='text-zinc-300 hover:text-orange-400 transition-colors duration-200 text-sm px-2 py-1'>Companies</Link>
                                                            <Link to="/admin/jobs" className='text-zinc-300 hover:text-orange-400 transition-colors duration-200 text-sm px-2 py-1'>Jobs</Link>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link to="/" className='text-zinc-300 hover:text-orange-400 transition-colors duration-200 text-sm px-2 py-1'>Home</Link>
                                                            <Link to="/jobs" className='text-zinc-300 hover:text-orange-400 transition-colors duration-200 text-sm px-2 py-1'>Jobs</Link>
                                                            <Link to="/browse" className='text-zinc-300 hover:text-orange-400 transition-colors duration-200 text-sm px-2 py-1'>Browse</Link>
                                                        </>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )
                    }

                </div>
            </div>

        </div>
    )
}

export default Navbar;


