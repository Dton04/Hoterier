import React from 'react';
import { HashLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';

function Loader({ loading = true, message = "Đang tải dữ liệu..." }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
  key="loader"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
>
  <HashLoader color="#2563eb" size={90} speedMultiplier={1.2} />
  <motion.p
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.4 }}
    className="mt-5 text-lg font-medium text-[#003580] tracking-wide"
  >
    {message}
  </motion.p>
</motion.div>

      )}
    </AnimatePresence>
  );
}

export default Loader;
