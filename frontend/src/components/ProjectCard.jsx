// src/components/ProjectCard.jsx
import React from 'react';
import { FaFolder } from 'react-icons/fa';

const ProjectCard = ({ project }) => {
    return (
        // Changed hover background and added a subtle scaling effect
        <a href="#" className="flex flex-col p-3 rounded-lg hover:bg-gray-800 hover:scale-105 transition-all duration-200 border border-gray-700">
            <span className="font-semibold flex items-center">
                <FaFolder className="mr-3 text-gray-400" />
                {project.name}
            </span>
            <span className="text-xs text-gray-500 mt-1 ml-7">
                Updated 2 hours ago
            </span>
        </a>
    );
};

export default ProjectCard;