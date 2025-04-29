import React from "react";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
export function Loader() {
  return (
    <>
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1, repeat: Infinity, ease: "linear" },
            }}
          >
            <Activity className="h-12 w-12 text-primary mx-auto mb-4" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Loading your health dashboard...
          </motion.p>
        </div>
      </div>
    </>
  );
}
