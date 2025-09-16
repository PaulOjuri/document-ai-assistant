import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getFileTypeIcon(fileType?: string): string {
  if (!fileType) return '📄';

  const iconMap: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    txt: '📄',
    md: '📝',
    mp3: '🎵',
    wav: '🎵',
    mp4: '🎥',
  };
  return iconMap[fileType.toLowerCase()] || '📄';
}

export function getSafeArtifactColor(artifact: string): string {
  const colorMap: Record<string, string> = {
    Epic: 'bg-purple-100 text-purple-800',
    Feature: 'bg-blue-100 text-blue-800',
    'User Story': 'bg-green-100 text-green-800',
    Capability: 'bg-orange-100 text-orange-800',
    Solution: 'bg-red-100 text-red-800',
    Theme: 'bg-yellow-100 text-yellow-800',
    Enabler: 'bg-gray-100 text-gray-800',
  };
  return colorMap[artifact] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    High: 'text-red-600',
    Medium: 'text-yellow-600',
    Low: 'text-green-600',
  };
  return colorMap[priority] || 'text-gray-600';
}