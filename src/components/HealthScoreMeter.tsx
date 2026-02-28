import { motion } from "framer-motion";
import clsx from "clsx";

interface HealthScoreMeterProps {
    score: number; // 0 to 100
    message?: string;
}

export function HealthScoreMeter({ score, message }: HealthScoreMeterProps) {
    // Determine color based on score
    let colorClass = "text-green-500";

    if (score < 50) {
        colorClass = "text-red-500";
    } else if (score < 75) {
        colorClass = "text-yellow-500";
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center max-w-sm w-full">
            <h3 className="text-lg font-medium text-slate-700 mb-2">Financial Health</h3>

            <div className="relative flex items-center justify-center w-40 h-40">
                {/* Background Circle */}
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-100"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 * (1 - score / 100)}
                        className={clsx(colorClass, "transition-all duration-1000 ease-out")}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - score / 100) }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className={clsx("text-4xl font-bold", colorClass)}>{score}</span>
                    <span className="text-sm font-medium text-slate-400">/ 100</span>
                </div>
            </div>

            {message && (
                <p className="mt-6 text-sm text-center text-slate-600 bg-slate-50 p-3 rounded-lg w-full">
                    {message}
                </p>
            )}
        </div>
    );
}
