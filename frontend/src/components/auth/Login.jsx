import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import SlideButton from '../ui/slide-button'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading, setUser } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'



const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: "",
        role: "",
    });
    const [slideButtonKey, setSlideButtonKey] = useState(0); // Add this to control button reset
    const { loading,user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true,
            });
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
            throw error; // Re-throw to let SlideButton handle error state
        } finally {
            dispatch(setLoading(false));
        }
    }

    // Handler for SlideButton
    const handleSlideLogin = async () => {
        // Validate form before proceeding
        if (!input.email || !input.password || !input.role) {
            toast.error("Please fill in all fields");
            throw new Error("Validation failed");
        }
        
        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true,
            });
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
            // Reset the slide button after error by changing its key
            setTimeout(() => {
                setSlideButtonKey(prev => prev + 1);
            }, 2000); // Reset after showing error for 2 seconds
            throw error; // Re-throw to let SlideButton handle error state
        } finally {
            dispatch(setLoading(false));
        }
    }
    useEffect(()=>{
        if(user){
            navigate("/");
        }
    },[user, navigate])
    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <div className='flex items-center justify-center w-full mx-auto min-h-screen py-4 px-4 sm:py-10'>
                <Card className="w-full max-w-md mx-4 sm:mx-0 bg-zinc-950 border-zinc-800">
                    <CardHeader className="space-y-1 px-4 sm:px-6 pt-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-center text-zinc-50">
                            Login to your account
                        </CardTitle>
                        <CardDescription className="text-center text-zinc-400 text-sm">
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-6">
                        <form onSubmit={submitHandler} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-200 text-sm">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={input.email}
                                    name="email"
                                    onChange={changeEventHandler}
                                    placeholder="m@example.com"
                                    className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500 hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-200 h-10 sm:h-11"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-zinc-200 text-sm">Password</Label>
                                    <Link to="#" className="text-xs sm:text-sm text-zinc-400 hover:text-orange-400 hover:underline transition-colors duration-200">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={input.password}
                                    name="password"
                                    onChange={changeEventHandler}
                                    placeholder="Enter your password"
                                    className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500 hover:border-zinc-600 hover:bg-zinc-800 transition-all duration-200 h-10 sm:h-11"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-200 text-sm">Account Type</Label>
                                <RadioGroup className="flex items-center gap-4 sm:gap-6 flex-wrap">
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="radio"
                                            id="student"
                                            name="role"
                                            value="student"
                                            checked={input.role === 'student'}
                                            onChange={changeEventHandler}
                                            className="cursor-pointer w-4 h-4 bg-zinc-900 border-zinc-700 text-zinc-50 focus:ring-zinc-600"
                                        />
                                        <Label htmlFor="student" className="cursor-pointer text-zinc-200 text-sm">Student</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="radio"
                                            id="recruiter"
                                            name="role"
                                            value="recruiter"
                                            checked={input.role === 'recruiter'}
                                            onChange={changeEventHandler}
                                            className="cursor-pointer w-4 h-4 bg-zinc-900 border-zinc-700 text-zinc-50 focus:ring-zinc-600"
                                        />
                                        <Label htmlFor="recruiter" className="cursor-pointer text-zinc-200 text-sm">Recruiter</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-4 pt-2">
                                {/* Regular Login Button */}
                                {/*
                                    loading ? (
                                        <Button className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200 h-10 sm:h-11" disabled> 
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 
                                            Please wait 
                                        </Button>
                                    ) : (
                                        <Button type="submit" className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200 h-10 sm:h-11">
                                            Login
                                        </Button>
                                    )
                                */}
                                
                                {/* Slide to Login */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-full flex justify-center">
                                        <SlideButton 
                                            key={slideButtonKey}
                                            onComplete={handleSlideLogin}
                                            disabled={loading || !input.email || !input.password || !input.role}
                                            className="bg-white text-black hover:bg-zinc-100 border border-zinc-800"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 text-center px-2">
                                        Drag to login • Click error to retry
                                    </p>
                                </div>
                            </div>
                        </form>
                        
                        <div className="mt-6 text-center text-sm">
                            <span className="text-zinc-400">Don&apos;t have an account?</span>{" "}
                            <Link to="/signup" className="text-zinc-50 hover:text-zinc-300 hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Login