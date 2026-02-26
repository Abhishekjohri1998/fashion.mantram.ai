import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

export interface UploadedImage {
  key: string;
  label: string;
  preview: string;
  angleType: string;
}

interface ProjectUploadsContextType {
  projectId: string;
  images: UploadedImage[];
  addImage: (image: UploadedImage, file?: File) => void;
}

const ProjectUploadsContext = createContext<ProjectUploadsContextType>({
  projectId: "",
  images: [],
  addImage: () => { },
});

export const useProjectUploads = () => useContext(ProjectUploadsContext);

export const ProjectUploadsProvider = ({ children, projectId }: { children: ReactNode; projectId: string }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Load saved uploads on mount
  useEffect(() => {
    if (!projectId) return;
    const fetchUploads = async () => {
      try {
        const { data } = await api.get(`/project-uploads/${projectId}`);
        const loaded: UploadedImage[] = data.map((row: any) => ({
          key: row.angle_key,
          label: row.label,
          preview: row.file_path.startsWith('http') ? row.file_path : `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${row.file_path}`,
          angleType: row.angle_key,
        }));
        setImages(loaded);
      } catch (error) {
        console.error("Failed to fetch uploads", error);
      }
    };
    fetchUploads();
  }, [projectId]);

  const addImage = async (image: UploadedImage, file?: File) => {
    // Update local state immediately with blob preview
    setImages(prev => {
      const exists = prev.findIndex(i => i.key === image.key);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = image;
        return updated;
      }
      return [...prev, image];
    });

    // Persist to storage + DB if file provided
    if (file && projectId) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        // 1. Upload file to server
        const { data: uploadRes } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // 2. Save mapping to Database
        await api.post('/project-uploads', {
          projectId,
          angle_key: image.key,
          label: image.label,
          file_path: uploadRes.filePath,
        });

        // Update preview with server path
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        setImages(prev => prev.map(i => i.key === image.key ? { ...i, preview: `${serverUrl}${uploadRes.filePath}` } : i));
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
  };

  return (
    <ProjectUploadsContext.Provider value={{ projectId, images, addImage }}>
      {children}
    </ProjectUploadsContext.Provider>
  );
};
