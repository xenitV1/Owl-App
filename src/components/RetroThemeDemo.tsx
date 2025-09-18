'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RetroThemeDemo: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold retro-text-glow mb-2">
          Retro Theme Demo
        </h1>
        <p className="text-lg retro-text-outline">
          Experience the nostalgic 80s aesthetic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="retro-shadow-lg retro-crinkled">
          <CardHeader>
            <CardTitle className="retro-gradient-primary text-transparent bg-clip-text">
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="w-8 h-8 bg-[#FBCD43] rounded retro-shadow-sm"></div>
              <div className="w-8 h-8 bg-[#E64B35] rounded retro-shadow-sm"></div>
              <div className="w-8 h-8 bg-[#C6312B] rounded retro-shadow-sm"></div>
              <div className="w-8 h-8 bg-[#992D3D] rounded retro-shadow-sm"></div>
              <div className="w-8 h-8 bg-[#702647] rounded retro-shadow-sm"></div>
              <div className="w-8 h-8 bg-[#E7E1CB] rounded retro-shadow-sm border-2 border-gray-400"></div>
            </div>
            <p className="text-sm">
              Vintage color scheme inspired by 80s design
            </p>
          </CardContent>
        </Card>

        <Card className="retro-shadow-lg retro-pixel-border">
          <CardHeader>
            <CardTitle className="retro-starburst">
              Interactive Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="retro-shadow-md w-full">
              Retro Button
            </Button>
            <Button variant="secondary" className="retro-shadow-md w-full">
              Secondary Button
            </Button>
            <div className="retro-border-dashed p-4 text-center">
              Dashed Border Box
            </div>
          </CardContent>
        </Card>

        <Card className="retro-shadow-lg retro-gradient-chart">
          <CardHeader>
            <CardTitle className="text-white">
              Gradient Effects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="retro-gradient-primary h-16 rounded retro-shadow-sm"></div>
            <div className="retro-gradient-accent h-16 rounded retro-shadow-sm"></div>
            <div className="retro-gradient-chart h-16 rounded retro-shadow-sm"></div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Switch to Retro Light or Retro Dark theme in Settings to see the full effect
        </p>
      </div>
    </div>
  );
};
