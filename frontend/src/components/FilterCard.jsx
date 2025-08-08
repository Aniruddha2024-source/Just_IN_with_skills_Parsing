/*import React, { useEffect, useState } from 'react'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { useDispatch } from 'react-redux'
import { setSearchedQuery } from '@/redux/jobSlice'

const fitlerData = [
    {
        fitlerType: "Location",
        array: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai"]
    },
    {
        fitlerType: "Industry",
        array: ["Frontend Developer", "Backend Developer", "FullStack Developer"]
    },
    {
        fitlerType: "Salary",
        array: ["0-40k", "42-1lakh", "1lakh to 5lakh"]
    },
]

const FilterCard = () => {
    const [selectedValue, setSelectedValue] = useState('');
    const dispatch = useDispatch();
    const changeHandler = (value) => {
        setSelectedValue(value);
    }
    useEffect(()=>{
        dispatch(setSearchedQuery(selectedValue));
    },[selectedValue]);
    return (
        <div className='w-full bg-white p-3 rounded-md'>
            <h1 className='font-bold text-lg'>Filter Jobs</h1>
            <hr className='mt-3' />
            <RadioGroup value={selectedValue} onValueChange={changeHandler}>
                {
                    fitlerData.map((data, index) => (
                        <div>
                            <h1 className='font-bold text-lg'>{data.fitlerType}</h1>
                            {
                                data.array.map((item, idx) => {
                                    const itemId = `id${index}-${idx}`
                                    return (
                                        <div className='flex items-center space-x-2 my-2'>
                                            <RadioGroupItem value={item} id={itemId} />
                                            <Label htmlFor={itemId}>{item}</Label>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    ))
                }
            </RadioGroup>
        </div>
    )
}

export default FilterCard*/

/*import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useNavigate } from 'react-router-dom';

const fitlerData = [
  {
    fitlerType: 'Location',
    array: ['Delhi NCR', 'Bangalore', 'Mumbai', 'Chennai', 'Kolkata'],
  },
  {
    fitlerType: 'Salary',
    array: ['0-3 LPA', '4-8 LPA', '8-15 LPA', '15+ LPA'],
  },
];

const FilterCard = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();

    if (location) params.append('location', location);
    if (salary) {
      const salaryRange = salary.toLowerCase().replace('lpa', '').replace(/\s/g, '');
      params.append('salary', salaryRange); // e.g., "4-8"
    }

    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md mb-4">
      {fitlerData.map((filter, index) => (
        <div key={index} className="mb-4">
          <h3 className="font-semibold mb-2">{filter.fitlerType}</h3>
          <RadioGroup
            onValueChange={(value) =>
              filter.fitlerType === 'Location'
                ? setLocation(value)
                : setSalary(value)
            }
          >
            {filter.array.map((item, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={item} id={`${filter.fitlerType}-${i}`} />
                <Label htmlFor={`${filter.fitlerType}-${i}`}>{item}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      <button
        onClick={handleApplyFilters}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterCard;*/


import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useNavigate, useLocation } from 'react-router-dom';

const filterData = [
  {
    filterType: 'Role',
    array: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst'],
  },
  {
    filterType: 'Location',
    array: ['Delhi NCR', 'Bangalore', 'Mumbai', 'Chennai', 'Kolkata'],
  },
  {
    filterType: 'Salary',
    array: ['0-3 LPA', '4-8 LPA', '8-15 LPA', '15+ LPA'],
  },
];

const FilterCard = () => {
  const navigate = useNavigate();
  const locationObj = useLocation();
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');

  // Reset filters when URL params are cleared (e.g., when navigating back)
  useEffect(() => {
    const params = new URLSearchParams(locationObj.search);
    if (!params.get('role')) setRole('');
    if (!params.get('location')) setLocation('');
    if (!params.get('salary')) setSalary('');
  }, [locationObj.search]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (location) params.append('location', location);
    if (salary) params.append('salary', salary);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md mb-4">
      {filterData.map((filter, index) => (
        <div key={index} className="mb-4">
          <h3 className="font-semibold mb-2">{filter.filterType}</h3>
          <RadioGroup
            value={
              filter.filterType === 'Role' ? role :
              filter.filterType === 'Location' ? location :
              filter.filterType === 'Salary' ? salary : ''
            }
            onValueChange={(value) => {
              if (filter.filterType === 'Role') setRole(value);
              else if (filter.filterType === 'Location') setLocation(value);
              else if (filter.filterType === 'Salary') setSalary(value);
            }}
          >
            {filter.array.map((item, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={item} id={`${filter.filterType}-${i}`} />
                <Label htmlFor={`${filter.filterType}-${i}`}>{item}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      <button
        onClick={handleApplyFilters}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterCard;





