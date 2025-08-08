// import React, { useState } from 'react'
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
// import { Label } from './ui/label'
// import { Input } from './ui/input'
// import { Button } from './ui/button'
// import { Loader2 } from 'lucide-react'
// import { useDispatch, useSelector } from 'react-redux'
// import axios from 'axios'
// import { USER_API_END_POINT } from '@/utils/constant'
// import { setUser } from '@/redux/authSlice'
// import { toast } from 'sonner'

// const UpdateProfileDialog = ({ open, setOpen }) => {
//   const [loading, setLoading] = useState(false);
//   const { user } = useSelector(store => store.auth);

//   const [input, setInput] = useState({
//     fullname: user?.fullname || "",
//     email: user?.email || "",
//     phoneNumber: user?.phoneNumber || "",
//     bio: user?.profile?.bio || "",
//     skills: user?.profile?.skills?.join(", ") || "", // convert array to comma string
//     file: null
//   });

//   const dispatch = useDispatch();

//   const changeEventHandler = (e) => {
//     setInput({ ...input, [e.target.name]: e.target.value });
//   }

//   const fileChangeHandler = (e) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setInput({ ...input, file });
//     }
//   }

//   const submitHandler = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("fullname", input.fullname);
//     formData.append("email", input.email);
//     formData.append("phoneNumber", input.phoneNumber);
//     formData.append("bio", input.bio);
//     formData.append("skills", input.skills); // backend splits comma string
//     if (input.file) {
//       formData.append("file", input.file);
//     }

//     try {
//       setLoading(true);
//       const res = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         },
//         withCredentials: true
//       });

//       if (res.data.success) {
//         dispatch(setUser(res.data.user));
//         toast.success(res.data.message);
//         setOpen(false);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error(error.response?.data?.message || "Profile update failed.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Dialog open={open}>
//       <DialogContent className="sm:max-w-[425px]" onInteractOutside={() => setOpen(false)}>
//         <DialogHeader>
//           <DialogTitle>Update Profile</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={submitHandler}>
//           <div className='grid gap-4 py-4'>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="fullname" className="text-right">Name</Label>
//               <Input
//                 id="fullname"
//                 name="fullname"
//                 type="text"
//                 value={input.fullname}
//                 onChange={changeEventHandler}
//                 className="col-span-3"
//               />
//             </div>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="email" className="text-right">Email</Label>
//               <Input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={input.email}
//                 onChange={changeEventHandler}
//                 className="col-span-3"
//               />
//             </div>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="phoneNumber" className="text-right">Number</Label>
//               <Input
//                 id="phoneNumber"
//                 name="phoneNumber"
//                 value={input.phoneNumber}
//                 onChange={changeEventHandler}
//                 className="col-span-3"
//               />
//             </div>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="bio" className="text-right">Bio</Label>
//               <Input
//                 id="bio"
//                 name="bio"
//                 value={input.bio}
//                 onChange={changeEventHandler}
//                 className="col-span-3"
//               />
//             </div>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="skills" className="text-right">Skills</Label>
//               <Input
//                 id="skills"
//                 name="skills"
//                 placeholder="e.g. HTML, CSS, React"
//                 value={input.skills}
//                 onChange={changeEventHandler}
//                 className="col-span-3"
//               />
//             </div>
//             <div className='grid grid-cols-4 items-center gap-4'>
//               <Label htmlFor="resume" className="text-right">Resume</Label>
//               <Input
//                 id="resume"
//                 name="resume"
//                 type="file"
//                 accept="application/pdf"
//                 onChange={fileChangeHandler}
//                 className="col-span-3"
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             {
//               loading ? (
//                 <Button className="w-full my-4" disabled>
//                   <Loader2 className='mr-2 h-4 w-4 animate-spin' />
//                   Please wait
//                 </Button>
//               ) : (
//                 <Button type="submit" className="w-full my-4">Update</Button>
//               )
//             }
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export default UpdateProfileDialog;










// // import React, { useState } from 'react'
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogFooter,
// //   DialogHeader,
// //   DialogTitle
// // } from './ui/dialog'
// // import { Label } from './ui/label'
// // import { Input } from './ui/input'
// // import { Button } from './ui/button'
// // import { Loader2 } from 'lucide-react'
// // import { useDispatch, useSelector } from 'react-redux'
// // import axios from 'axios'
// // import { USER_API_END_POINT } from '@/utils/constant'
// // import { setUser } from '@/redux/authSlice'
// // import { toast } from 'sonner'

// // const UpdateProfileDialog = ({ open, setOpen }) => {
// //   const [loading, setLoading] = useState(false);
// //   const { user } = useSelector(store => store.auth);

// //   const [input, setInput] = useState({
// //     fullname: user?.fullname || "",
// //     email: user?.email || "",
// //     phoneNumber: user?.phoneNumber || "",
// //     bio: user?.profile?.bio || "",
// //     skills: user?.profile?.skills?.join(',') || "",
// //     resumeFile: null,
// //     profilePhotoFile: null
// //   });

// //   const dispatch = useDispatch();

// //   const changeEventHandler = (e) => {
// //     setInput({ ...input, [e.target.name]: e.target.value });
// //   }

// //   const handleFileChange = (e) => {
// //     const { name, files } = e.target;
// //     if (files && files.length > 0) {
// //       setInput({ ...input, [name]: files[0] });
// //     }
// //   }

// //   const submitHandler = async (e) => {
// //     e.preventDefault();
// //     const formData = new FormData();
// //     formData.append("fullname", input.fullname);
// //     formData.append("email", input.email);
// //     formData.append("phoneNumber", input.phoneNumber);
// //     formData.append("bio", input.bio);
// //     formData.append("skills", input.skills);

// //     if (input.resumeFile) {
// //       formData.append("resume", input.resumeFile);
// //     }
// //     if (input.profilePhotoFile) {
// //       formData.append("profilePhoto", input.profilePhotoFile);
// //     }

// //     try {
// //       setLoading(true);
// //       const res = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data'
// //         },
// //         withCredentials: true
// //       });
// //       if (res.data.success) {
// //         dispatch(setUser(res.data.user));
// //         toast.success(res.data.message);
// //       }
// //     } catch (error) {
// //       console.log(error);
// //       toast.error(error.response?.data?.message || 'Something went wrong');
// //     } finally {
// //       setLoading(false);
// //     }
// //     setOpen(false);
// //   }

// //   return (
// //     <div>
// //       <Dialog open={open}>
// //         <DialogContent className="sm:max-w-[425px]" onInteractOutside={() => setOpen(false)}>
// //           <DialogHeader>
// //             <DialogTitle>Update Profile</DialogTitle>
// //           </DialogHeader>
// //           <form onSubmit={submitHandler}>
// //             <div className='grid gap-4 py-4'>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="fullname" className="text-right">Name</Label>
// //                 <Input
// //                   id="fullname"
// //                   name="fullname"
// //                   type="text"
// //                   value={input.fullname}
// //                   onChange={changeEventHandler}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="email" className="text-right">Email</Label>
// //                 <Input
// //                   id="email"
// //                   name="email"
// //                   type="email"
// //                   value={input.email}
// //                   onChange={changeEventHandler}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="phoneNumber" className="text-right">Number</Label>
// //                 <Input
// //                   id="phoneNumber"
// //                   name="phoneNumber"
// //                   value={input.phoneNumber}
// //                   onChange={changeEventHandler}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="bio" className="text-right">Bio</Label>
// //                 <Input
// //                   id="bio"
// //                   name="bio"
// //                   value={input.bio}
// //                   onChange={changeEventHandler}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="skills" className="text-right">Skills</Label>
// //                 <Input
// //                   id="skills"
// //                   name="skills"
// //                   value={input.skills}
// //                   onChange={changeEventHandler}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="resume" className="text-right">Resume</Label>
// //                 <Input
// //                   id="resume"
// //                   name="resumeFile"
// //                   type="file"
// //                   accept="application/pdf"
// //                   onChange={handleFileChange}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //               <div className='grid grid-cols-4 items-center gap-4'>
// //                 <Label htmlFor="profilePhoto" className="text-right">Profile Picture</Label>
// //                 <Input
// //                   id="profilePhoto"
// //                   name="profilePhotoFile"
// //                   type="file"
// //                   accept="image/*"
// //                   onChange={handleFileChange}
// //                   className="col-span-3"
// //                 />
// //               </div>
// //             </div>
// //             <DialogFooter>
// //               {
// //                 loading ? <Button className="w-full my-4"> <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Please wait </Button> : <Button type="submit" className="w-full my-4">Update</Button>
// //               }
// //             </DialogFooter>
// //           </form>
// //         </DialogContent>
// //       </Dialog>
// //     </div>
// //   )
// // }

// // export default UpdateProfileDialog



// import React, { useState } from 'react';
// import { Input } from './ui/input';
// import { Label } from './ui/label';
// import { Button } from './ui/button';
// import axios from 'axios';
// import { toast } from 'sonner';
// import { USER_API_END_POINT } from '@/utils/constant';

// const UpdateProfileDialog = () => {
//   const [input, setInput] = useState({
//     fullname: '',
//     email: '',
//     phoneNumber: '',
//     bio: '',
//     skills: '',
//     resume: null
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setInput((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     setInput((prev) => ({ ...prev, resume: e.target.files[0] }));
//   };

//   const submitHandler = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append('fullname', input.fullname);
//     formData.append('email', input.email);
//     formData.append('phoneNumber', input.phoneNumber);
//     formData.append('bio', input.bio);
//     formData.append('skills', input.skills);
//     if (input.resume) {
//       formData.append('resume', input.resume);
//     }

//     try {
//       const res = await axios.post(
//         `${USER_API_END_POINT}/profile/update`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           },
//           withCredentials: true
//         }
//       );

//       if (res.data.success) {
//         toast.success(res.data.message);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error(error.response?.data?.message || 'Failed to update profile');
//     }
//   };

//   return (
//     <form onSubmit={submitHandler} className="p-6 space-y-4 max-w-lg mx-auto">
//       <div>
//         <Label>Full Name</Label>
//         <Input
//           name="fullname"
//           type="text"
//           value={input.fullname}
//           onChange={handleChange}
//         />
//       </div>
//       <div>
//         <Label>Email</Label>
//         <Input
//           name="email"
//           type="email"
//           value={input.email}
//           onChange={handleChange}
//         />
//       </div>
//       <div>
//         <Label>Phone Number</Label>
//         <Input
//           name="phoneNumber"
//           type="number"
//           value={input.phoneNumber}
//           onChange={handleChange}
//         />
//       </div>
//       <div>
//         <Label>Bio</Label>
//         <Input
//           name="bio"
//           type="text"
//           value={input.bio}
//           onChange={handleChange}
//         />
//       </div>
//       <div>
//         <Label>Skills (comma separated)</Label>
//         <Input
//           name="skills"
//           type="text"
//           value={input.skills}
//           onChange={handleChange}
//         />
//       </div>
//       <div>
//         <Label>Resume (PDF)</Label>
//         <Input
//           name="resume"
//           type="file"
//           accept=".pdf"
//           onChange={handleFileChange}
//         />
//       </div>
//       <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
//         Update Profile
//       </Button>
//     </form>
//   );
// };

// export default UpdateProfileDialog;


import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';

const UpdateProfileDialog = ({ open, setOpen }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(store => store.auth);

  const [input, setInput] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    bio: user?.profile?.bio || "",
    skills: user?.profile?.skills?.join(", ") || "",
    file: null,
  });

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const fileChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, file });
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("fullname", input.fullname);
    formData.append("email", input.email);
    formData.append("phoneNumber", input.phoneNumber);
    formData.append("bio", input.bio);
    formData.append("skills", input.skills);
    if (input.file) {
      formData.append("file", input.file); // must match `.single("file")` in multer
    }

    

    try {
      setLoading(true);
      const res = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials: true
      });

      console.log("FormData being sent:");
        for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={() => setOpen(false)}>
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={submitHandler}>
          <div className="grid gap-4 py-4">
            <FormRow label="Name" name="fullname" value={input.fullname} onChange={changeHandler} />
            <FormRow label="Email" name="email" value={input.email} onChange={changeHandler} type="email" />
            <FormRow label="Phone Number" name="phoneNumber" value={input.phoneNumber} onChange={changeHandler} />
            <FormRow label="Bio" name="bio" value={input.bio} onChange={changeHandler} />
            <FormRow label="Skills" name="skills" value={input.skills} onChange={changeHandler} placeholder="e.g. HTML, CSS, React" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="resume" className="text-right">Resume</Label>
              <Input
                id="resume"
                name="file"
                type="file"
                accept="application/pdf"
                onChange={fileChangeHandler}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full my-4" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FormRow = ({ label, name, value, onChange, type = "text", placeholder = "" }) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor={name} className="text-right">{label}</Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="col-span-3"
    />
  </div>
);

export default UpdateProfileDialog;
