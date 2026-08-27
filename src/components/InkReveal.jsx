import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const InkChar = motion.span;

const InkReveal = ({ text }) => (
  <>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">
      {text.split("").map((ch, i) => (
        <InkChar
          key={i}
          style={{ display: "inline-block", whiteSpace: "pre" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.014, ease: EASE }}
        >
          {ch}
        </InkChar>
      ))}
    </span>
  </>
);

export default InkReveal;
