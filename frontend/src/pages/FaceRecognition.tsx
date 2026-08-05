import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Scan, UserCheck, AlertCircle, Loader2, CheckCircle2, RefreshCw, Activity, Database, Server } from 'lucide-react';
import Webcam from 'react-webcam';
import { cn } from '../lib/utils';
import { api, API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

function getEulerAngles(matrix: number[]) {
  const pitch = Math.asin(-matrix[6]);
  const yaw = Math.atan2(matrix[2], matrix[10]);
  const roll = Math.atan2(matrix[4], matrix[5]);
  return {
    pitch: pitch * (180 / Math.PI),
    yaw: yaw * (180 / Math.PI),
    roll: roll * (180 / Math.PI)
  };
}

export function FaceRecognition() {
  const { token } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [liveMetrics, setLiveMetrics] = useState({ yaw: 0, pitch: 0, distance: 0.5, quality: 100 });
  const [modelStatus, setModelStatus] = useState('Loading...');
  const [scanTime, setScanTime] = useState(0);

  useEffect(() => {
    let active = true;
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const fl = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (active) {
            setLandmarker(fl);
            setModelStatus('Active');
        }
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
        if (active) setModelStatus('Error');
      }
    };
    initModel();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isScanning || !landmarker || !webcamRef.current?.video) return;

    let animationFrame: number;
    let lastVideoTime = -1;

    const tick = () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const results = landmarker.detectForVideo(video, performance.now());
          
          if (results.faceLandmarks.length > 0 && results.facialTransformationMatrixes?.length) {
            const matrix = results.facialTransformationMatrixes[0].data;
            const { yaw, pitch } = getEulerAngles(matrix as any);
            const landmarks = results.faceLandmarks[0];
            const xs = landmarks.map(l => l.x);
            const boxWidth = Math.max(...xs) - Math.min(...xs);
            
            const quality = Math.max(0, Math.min(100, 100 - (Math.abs(yaw) + Math.abs(pitch)) * 0.5));
            setLiveMetrics({ yaw, pitch, distance: boxWidth, quality });
          }
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };
    
    tick();
    return () => cancelAnimationFrame(animationFrame);
  }, [isScanning, landmarker]);

  const recognizeFace = useCallback(async () => {
    if (!webcamRef.current || !isScanning) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setRecognizing(true);
    const start = performance.now();
    try {
      const response = await api.post('/biometrics/recognize', { image: imageSrc }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      setScanTime(performance.now() - start);
      
      if (data.match) {
        setMatchResult(data);
        const newLog = {
          id: Date.now(),
          name: data.user.name,
          confidence: data.confidence,
          time: new Date().toLocaleTimeString(),
          profile_picture_path: data.user.profile_picture_path,
          pose: data.matched_pose
        };
        setLogs(prev => [newLog, ...prev].slice(0, 10));
      } else {
        // Keep the last matched result on screen instead of instantly clearing it
        // setMatchResult(null);
      }
    } catch (err) {
      console.error(err);
      // Don't clear on error to keep last recognized profile visible
      // setMatchResult(null);
    } finally {
      setRecognizing(false);
    }
  }, [isScanning, token]);

  useEffect(() => {
    if (!isScanning) {
      setMatchResult(null);
    }
  }, [isScanning]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isScanning) {
      interval = setInterval(() => {
        recognizeFace();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, recognizeFace]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  const getPoseLabel = (yaw: number, pitch: number) => {
      if (Math.abs(yaw) < 10 && Math.abs(pitch) < 10) return 'Front';
      if (yaw < -15) return 'Left';
      if (yaw > 15) return 'Right';
      if (pitch > 10) return 'Up';
      if (pitch < -10) return 'Down';
      return 'Neutral';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-surface/40 p-6 rounded-2xl border border-border backdrop-blur-sm shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-4 uppercase tracking-wider">
            <span className={cn("w-2 h-2 rounded-full", isScanning ? "bg-accent animate-pulse" : "bg-secondary")}></span> {isScanning ? 'Scanner Active' : 'Scanner Standby'}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Live Recognition</h1>
          <p className="text-secondary font-medium text-lg">Real-time deep embedding identification and telemetry.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-border">
            <div className="text-center">
                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Model Status</p>
                <div className="flex items-center justify-center gap-2">
                    <Database className={cn("w-4 h-4", modelStatus === 'Active' ? 'text-success' : 'text-error')} />
                    <span className="font-bold">{modelStatus}</span>
                </div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">System Load</p>
                <div className="flex items-center justify-center gap-2">
                    <Server className="w-4 h-4 text-accent" />
                    <span className="font-bold">Normal</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* CAMERA CARD */}
          <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
             
             <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent" />
                Live Camera Feed
              </h3>
              <button 
                  onClick={() => setIsScanning(!isScanning)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 border",
                    isScanning 
                      ? "bg-error/10 border-error/20 text-error hover:bg-error/20" 
                      : "bg-accent text-white border-accent hover:bg-accent/90 shadow-accent/25"
                  )}
              >
                 {isScanning ? 'Stop Feed' : 'Start Recognition'}
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-2xl border-4 border-border/50 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              {!isScanning ? (
                <div className="text-center space-y-4 animate-in fade-in">
                  <div className="w-20 h-20 rounded-full bg-surface border border-border mx-auto flex items-center justify-center shadow-md">
                    <Scan className="w-10 h-10 text-secondary" />
                  </div>
                  <p className="text-secondary font-medium text-lg">Camera is currently inactive.</p>
                </div>
              ) : (
                <div className="relative w-full h-full animate-in fade-in zoom-in-95 duration-500">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {/* Face Tracker Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                     <div className={cn(
                       "border-2 rounded-2xl transition-all duration-300 relative flex items-center justify-center",
                       matchResult ? "border-success bg-success/10 shadow-[0_0_50px_rgba(34,197,94,0.3)]" : "border-accent/50 border-dashed"
                     )} style={{ width: `${liveMetrics.distance * 100}%`, height: `${liveMetrics.distance * 130}%`, minWidth: '150px', minHeight: '200px' }}>
                        
                        {recognizing && (
                           <div className="absolute left-0 right-0 h-1 bg-accent/80 shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-[scan_1.5s_ease-in-out_infinite]" />
                        )}

                        {matchResult && (
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 whitespace-nowrap animate-in slide-in-from-bottom-2">
                             <CheckCircle2 className="w-4 h-4" />
                             {matchResult.user.name} ({matchResult.confidence.toFixed(1)}%)
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Top HUD */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                     <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                        {recognizing ? (
                          <><RefreshCw className="w-4 h-4 text-accent animate-spin" /><span className="text-xs text-white font-medium tracking-widest uppercase">Analyzing...</span></>
                        ) : (
                          <><div className="w-2 h-2 rounded-full bg-success animate-pulse" /><span className="text-xs text-white font-medium tracking-widest uppercase">Scanning</span></>
                        )}
                      </div>
                      
                      <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-white font-mono text-[10px] space-y-1 border border-white/10 text-right">
                          <div className="text-accent font-bold mb-1 border-b border-white/20 pb-1 text-center">TELEMETRY</div>
                          <div>POS: {getPoseLabel(liveMetrics.yaw, liveMetrics.pitch)}</div>
                          <div>DST: {(liveMetrics.distance * 100).toFixed(1)}%</div>
                          <div>QLT: {liveMetrics.quality.toFixed(1)}%</div>
                      </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Live Metrics Bar */}
            {isScanning && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background p-3 rounded-xl border border-border">
                        <p className="text-xs text-secondary font-bold uppercase mb-1">Pose</p>
                        <p className="font-bold text-lg">{getPoseLabel(liveMetrics.yaw, liveMetrics.pitch)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-xl border border-border">
                        <p className="text-xs text-secondary font-bold uppercase mb-1">Distance</p>
                        <p className="font-bold text-lg">{(liveMetrics.distance * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-background p-3 rounded-xl border border-border">
                        <p className="text-xs text-secondary font-bold uppercase mb-1">Lighting / Sharpness</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-300" style={{width: `${liveMetrics.quality}%`}} />
                            </div>
                            <span className="font-bold text-sm">{liveMetrics.quality.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className="bg-background p-3 rounded-xl border border-border">
                        <p className="text-xs text-secondary font-bold uppercase mb-1">Inference Time</p>
                        <p className="font-bold text-lg">{scanTime > 0 ? `${scanTime.toFixed(0)}ms` : '--'}</p>
                    </div>
                </div>
            )}
          </div>

          {/* LOGS CARD */}
          <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-accent"/> Recognition Logs</h3>
            <div className="space-y-3">
               {logs.length === 0 ? (
                 <div className="p-8 text-center text-secondary border border-dashed border-border rounded-xl bg-background/50">
                   No recognitions in the current session.
                 </div>
               ) : (
                 logs.map((log) => (
                   <div key={log.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl hover:border-accent/50 transition-colors animate-in slide-in-from-left-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20 overflow-hidden shrink-0">
                          {log.profile_picture_path ? (
                            <img src={`${API_URL}/${log.profile_picture_path}`} alt={log.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{log.name}</p>
                          <p className="text-xs font-medium text-success flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3"/> {log.confidence.toFixed(1)}% | {log.pose}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-secondary bg-surface px-3 py-1 rounded-lg border border-border">{log.time}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">
          <div className="bg-surface/60 backdrop-blur-md border border-border rounded-2xl p-6 shadow-sm transition-all duration-500 sticky top-6">
            <h3 className="text-xl font-bold mb-6 text-center">Identified Profile</h3>
            
            {matchResult ? (
              <div className="animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-accent to-purple-500 mb-4 flex items-center justify-center border-4 border-background shadow-xl text-white text-3xl font-bold overflow-hidden">
                    {matchResult.user.profile_picture_path ? (
                      <img src={`${API_URL}/${matchResult.user.profile_picture_path}`} alt={matchResult.user.name} className="w-full h-full object-cover" />
                    ) : (
                      matchResult.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h4 className="font-extrabold text-2xl mb-1">{matchResult.user.name}</h4>
                  <p className="text-sm font-bold bg-accent/10 text-accent px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                    {matchResult.user.role}
                  </p>
                  <p className="text-sm text-success font-bold flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full border border-success/20">
                    <CheckCircle2 className="w-4 h-4" /> Verified Match
                  </p>
                </div>
                
                <div className="py-6 space-y-3 text-sm font-medium">
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary">System ID</span>
                    <span className="font-bold text-primary">#USR-{matchResult.user.id.substring(0,6)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary">Similarity Score</span>
                    <span className="font-bold text-success">{matchResult.confidence.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                    <span className="text-secondary">Matched Pose Data</span>
                    <span className="font-bold text-primary uppercase">{matchResult.matched_pose}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-12 opacity-50">
                <div className="w-24 h-24 rounded-full bg-border flex items-center justify-center mb-6">
                  <UserCheck className="w-10 h-10 text-secondary" />
                </div>
                <h4 className="font-bold text-lg mb-2">Awaiting Subject</h4>
                <p className="text-secondary text-sm max-w-[200px]">Position face in frame to query deep embedding database.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
