"use client";

import { motion } from "framer-motion";
import React from "react";

interface AnimateWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimateWrapper({
  children,
  className = "",
  delay = 0,
}: AnimateWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
