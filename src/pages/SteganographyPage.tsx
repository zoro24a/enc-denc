"use client";

import React from 'react';
import { SteganographyForm } from '@/components/SteganographyForm'; // Import the new component

const SteganographyPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-4 sm:p-8">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center text-primary dark:text-primary-foreground leading-tight">
        Steganography Tool
      </h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
        Securely hide secret information inside an image using LSB steganography.
      </p>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <div className="flex-1">
          <SteganographyForm mode="embed" />
        </div>
        <div className="flex-1">
          <SteganographyForm mode="extract" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-8 text-center max-w-md">
        This tool adds an additional security layer by hiding encrypted data inside images.
      </p>
    </div>
  );
};

export default SteganographyPage;