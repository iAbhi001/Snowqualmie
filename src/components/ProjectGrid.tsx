import React, { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage: string;
  stargazers_count: number;
  language: string;
  topics: string[];
}

export default function ProjectGrid() {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  // Replace with your GitHub username
  const username = "iAbhi001"; 

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
        const data = await response.json();
        
        // Sort by stars to highlight key builds
        const sortedData = data.sort((a: GithubRepo, b: GithubRepo) => 
          b.stargazers_count - a.stargazers_count
        );
        
        setRepos(sortedData);
      } catch (error) {
        console.error("Error fetching GitHub repos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  if (loading) {
    return <div className="text-white font-mono animate-pulse">Initializing Data Stream...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {repos.map((repo) => (
        <ProjectCard 
          key={repo.id}
          title={repo.name.replace(/-/g, ' ')} // Clean up repo-names-like-this
          description={repo.description || "No description provided."}
          tech={repo.topics.length > 0 ? repo.topics : [repo.language].filter(Boolean)}
          githubUrl={repo.html_url}
          demoUrl={repo.homepage}
          stars={repo.stargazers_count}
        />
      ))}
    </div>
  );
}