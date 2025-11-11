import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Card } from "./card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CardSwipe = ({ items, renderItem, onActionClick, onIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Motion values for drag gesture
  const x = useMotionValue(0);
  const scale = useTransform(
    x, 
    [-300, -150, 0, 150, 300], 
    [0.9, 0.95, 1, 0.95, 0.9]
  );
  const opacity = useTransform(
    x, 
    [-300, -150, 0, 150, 300], 
    [0.7, 0.9, 1, 0.9, 0.7]
  );
  const rotate = useTransform(
    x,
    [-300, -150, 0, 150, 300],
    [-5, -2, 0, 2, 5]
  );
  
  // Reset current index when items change (for example, when filter changes)
  useEffect(() => {
    setCurrentIndex(0);
  }, [items]);
  
  // Notify parent component when index changes
  useEffect(() => {
    if (onIndexChange && items.length > 0) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, items, onIndexChange]);

  const moveToNext = () => {
    if (currentIndex < items.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setDirection("left");
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setDirection(null);
        x.set(0);
        setIsAnimating(false);
      }, 300);
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setDirection("right");
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setDirection(null);
        x.set(0);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Handle drag end - only for navigation between cards
  const handleDragEnd = (_, info) => {
    if (isAnimating) return;
    
    if (info.offset.x > 100 && currentIndex > 0) {
      moveToPrevious();
    } else if (info.offset.x < -100 && currentIndex < items.length - 1) {
      moveToNext();
    } else {
      // Return to center if not enough drag
      x.set(0);
    }
  };

  // If there are no items
  if (!items || items.length === 0) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <p className="text-xl text-gray-500">No applicants to review</p>
      </div>
    );
  }

  // Ensure current index is valid when items change
  if (currentIndex >= items.length) {
    setCurrentIndex(items.length - 1);
    return null;
  }

  return (
    <div className="relative w-full max-w-xl mx-auto h-[600px] px-4">
      {/* Background card shadow for depth */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-40px)] h-[calc(100%-40px)] rounded-2xl bg-gray-200 opacity-50"></div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`${items[currentIndex]?._id}-${currentIndex}`}
          className="absolute top-0 left-0 right-0 w-full h-full"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{
            x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
            opacity: 0,
            transition: { duration: 0.3 }
          }}
          style={{ 
            x,
            scale,
            opacity,
            rotateZ: rotate
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full h-full overflow-y-auto overflow-x-hidden shadow-xl bg-white rounded-xl">
            {renderItem(items[currentIndex], onActionClick)}
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8 z-20">
        <button
          onClick={moveToPrevious}
          disabled={currentIndex === 0 || isAnimating}
          className={`p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors ${(currentIndex === 0 || isAnimating) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center justify-center px-4 py-2 bg-white rounded-full shadow-lg">
          <span className="text-base font-medium">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
        <button
          onClick={moveToNext}
          disabled={currentIndex === items.length - 1 || isAnimating}
          className={`p-4 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors ${(currentIndex === items.length - 1 || isAnimating) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Swipe instruction */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <div className="px-4 py-1 bg-white bg-opacity-80 rounded-full text-sm text-gray-600 shadow-sm">
          Swipe to browse applications
        </div>
      </div>
    </div>
  );
};

export { CardSwipe };
