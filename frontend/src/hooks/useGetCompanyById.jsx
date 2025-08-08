// /*import { useEffect, useState } from "react";
// import axios from "axios";
// import { JOB_API_END_POINT } from "@/utils/constant";

// const useGetCompanyById = (companyId) => {
//   const [company, setCompany] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchCompany = async () => {
//       if (!companyId) return;

//       try {
//         const res = await axios.get(`${JOB_API_END_POINT.replace("/post", "")}/company/get/${companyId}`, {
//           withCredentials: true
//         });

//         if (res.data.success) {
//           setCompany(res.data.company);
//         } else {
//           setError("Company not found");
//         }
//       } catch (err) {
//         console.error("Error fetching company:", err);
//         setError(err.response?.data?.message || "Failed to fetch company");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCompany();
//   }, [companyId]);

//   return { company, loading, error };
// };

// export default useGetCompanyById;*/

// import { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import { JOB_API_END_POINT } from "@/utils/constant";

// const useGetCompanyById = (companyId) => {
//   const [company, setCompany] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchCompany = useCallback(async () => {
//     if (!companyId) return;

//     try {
//       setLoading(true);
//       const res = await axios.get(`${JOB_API_END_POINT.replace("/post", "")}/get/${companyId}`, {
//         withCredentials: true
//       });

//       if (res.data.success) {
//         setCompany(res.data.company);
//         setError(null);
//       } else {
//         setError("Company not found");
//       }
//     } catch (err) {
//       console.error("Error fetching company:", err);
//       setError(err.response?.data?.message || "Failed to fetch company");
//     } finally {
//       setLoading(false);
//     }
//   }, [companyId]);

//   useEffect(() => {
//     fetchCompany();
//   }, [fetchCompany]);

//   return { company, loading, error, refetch: fetchCompany };
// };

// export default useGetCompanyById;

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant"; // ✅ use correct base endpoint

const useGetCompanyById = (companyId) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const res = await axios.get(`${COMPANY_API_END_POINT}/get/${companyId}`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setCompany(res.data.company);
        setError(null);
      } else {
        setError("Company not found");
      }
    } catch (err) {
      console.error("Error fetching company:", err);
      setError(err.response?.data?.message || "Failed to fetch company");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return { company, loading, error, refetch: fetchCompany };
};

export default useGetCompanyById;
