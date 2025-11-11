import React from "react";
import { motion } from "framer-motion"

const DURATION = 0.25
const STAGGER = 0.025

const FlipLink = ({ children, className = "", hoverColor = "hover:text-[#6A38C2]" }) => {
  const baseClasses = "relative block overflow-hidden whitespace-nowrap text-4xl font-semibold uppercase sm:text-7xl md:text-8xl cursor-pointer text-black dark:text-white/90 transition-colors duration-300";
  const combinedClasses = `${baseClasses} ${hoverColor} ${className}`;
  
  return (
    <motion.div
      initial="initial"
      whileHover="hovered"
      className={combinedClasses}
      style={{
        lineHeight: 0.75,
      }}>
      <div>
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}>
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {children.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
              },
              hovered: {
                y: 0,
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}>
            {l}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

export default FlipLink
