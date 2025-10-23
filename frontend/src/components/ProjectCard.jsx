// Project card component displaying project list and navigation link to project details
import React from 'react';
import { FaFolder } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    return (
        <Link to={`/project/${project.id}`} className="group flex flex-col p-3 rounded-lg hover:bg-gray-800 transition-all duration-200 border border-gray-700 hover:border-[var(--accent-blue)]">
            <span className="font-semibold flex items-center">
                <FaFolder className="mr-3 text-gray-400 group-hover:text-[var(--accent-blue)] transition-colors" />
                <span className="text-white">{project.name}</span>
            </span>
            <span className="text-xs text-gray-500 mt-1 ml-7">
                Updated 2 hours ago
            </span>
        </Link>
    );
};

export default ProjectCard;