import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];
const MotionGlyph = motion.span;

const RollingDigit = ({ char }) => (
  <span className="digit-cell">
    <AnimatePresence mode="popLayout" initial={false}>
      <MotionGlyph
        key={char}
        className="digit-glyph"
        initial={{ y: "0.5em", opacity: 0 }}
        animate={{ y: "0em", opacity: 1 }}
        exit={{ y: "-0.5em", opacity: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {char}
      </MotionGlyph>
    </AnimatePresence>
  </span>
);

const RollingNumber = ({ value }) => (
  <span className="rolling-number" aria-hidden="true">
    {value.split("").map((c, i) => (
      <RollingDigit char={c} key={i} />
    ))}
  </span>
);

export default RollingNumber;
