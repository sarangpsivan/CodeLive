import React from 'react';
import { Link } from 'react-router-dom';
import { FaCode, FaUserCircle, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { timeAgo } from '../utils/dateUtils';

const ProjectCard = ({ project }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative"
        >
            <Link to={`/project/${project.id}`} className="block h-full">
                <div className="h-full glass-card hover:bg-[#1F242A]/60 p-5 rounded-xl border border-white/5 group-hover:border-[var(--primary-purple)]/50 transition-all duration-300 flex flex-col justify-between shadow-lg">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-[var(--primary-purple)]/10 text-[var(--primary-purple)] group-hover:bg-[var(--primary-purple)] group-hover:text-white transition-colors duration-300">
                            <FaCode size={20} />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
                            <div className={`w-2 h-2 rounded-full ${project.active_count > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className={project.active_count > 0 ? 'text-green-400' : 'text-gray-500'}>
                                {project.active_count || 0} Active
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent-lavender)] transition-colors line-clamp-1" title={project.name}>
                            {project.name}
                        </h3>


                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1.5" title="Last updated">
                                <FaClock className="text-gray-600" />
                                {timeAgo(project.updated_at)}
                            </div>
                            <div className="flex items-center gap-1.5" title="Collaborators">
                                <FaUserCircle className="text-gray-600" />
                                {project.member_count} Members
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProjectCard;