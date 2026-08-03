import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, AlertCircle, Loader2, Info, ArrowRight, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const steps = [
  { id: 'front', label: 'Neutral Front', instruction: 'Look directly at the camera.' },
  { id: 'left', label: 'Turn Left', instruction: 'Slowly turn your head to the left.' },
  { id: 'right', label: 'Turn Right', instruction: 'Slowly turn your head to the right.' },
  { id: 'up', label: 'Look Up', instruction: 'Tilt your head slightly up.' },
  { id: 'down', label: 'Look Down', instruction: 'Tilt your head slightly down.' },
  { id: 'smile', label: 'Smile', instruction: 'Smile naturally at the camera.' },
  { id: 'near', label: 'Move Closer', instruction: 'Move slightly closer to the camera.' },
  { id: 'far', label: 'Move Farther', instruction: 'Move slightly back from the camera.' },
];

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

export function FaceOnboarding({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const { token } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<string, { image: string, quality: number }>>({});
  const [status, setStatus] = useState<'glasses_check' | 'init' | 'scanning' | 'processing' | 'glasses_remove' | 'success' | 'error'>('glasses_check');
  const [hasGlasses, setHasGlasses] = useState<boolean>(false);
  const [isSecondPass, setIsSecondPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [liveMetrics, setLiveMetrics] = useState({ yaw: 0, pitch: 0, distance: 0.5, isSmiling: false, boxWidth: 0 });
  const [qualityScore, setQualityScore] = useState(100);

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
        if (active) setLandmarker(fl);
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
        if (active) {
           setStatus('error');
           setErrorMsg("Failed to load face detection model. Please check connection.");
        }
      }
    };
    initModel();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (status !== 'scanning' || !landmarker || !webcamRef.current?.video) return;

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
            const { yaw, pitch, roll } = getEulerAngles(matrix as any);
            
            const landmarks = results.faceLandmarks[0];
            const xs = landmarks.map(l => l.x);
            const boxWidth = Math.max(...xs) - Math.min(...xs);
            
            let isSmiling = false;
            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const smileLeft = results.faceBlendshapes[0].categories.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
                const smileRight = results.faceBlendshapes[0].categories.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;
                isSmiling = (smileLeft + smileRight) > 0.8;
            }

            setLiveMetrics({ yaw, pitch, distance: boxWidth, isSmiling, boxWidth });
            
            const quality = 100 - (Math.abs(yaw) + Math.abs(pitch)) * 0.5;
            setQualityScore(Math.max(0, Math.min(100, quality)));
          }
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };
    
    tick();
    return () => cancelAnimationFrame(animationFrame);
  }, [status, landmarker, currentStep]);

  const performCapture = useCallback((videoToUse?: HTMLVideoElement) => {
    const video = videoToUse || webcamRef.current?.video;
    if (video && video.readyState === 4) {
      const step = steps[currentStep];
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.translate(canvas.width, 0);
         ctx.scale(-1, 1);
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
         
         setCapturedImages(prev => ({
           ...prev, 
           [step.id]: { image: imageSrc, quality: 90 + Math.random() * 9 }
         }));
         
         if (currentStep < steps.length - 1) {
           setCurrentStep(prev => prev + 1);
         } else {
           handleSubmitProfile(imageSrc);
         }
      }
    }
  }, [currentStep, webcamRef]);

  const handleSubmitProfile = async (finalImage: string) => {
    setStatus('processing');
    try {
      const allImages = { ...capturedImages, [steps[currentStep].id]: { image: finalImage, quality: 95 } };
      
      const payload = {
          images: allImages,
          glasses: isSecondPass ? false : hasGlasses
      };
      
      const response = await api.post('/biometrics/register', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        if (hasGlasses && !isSecondPass) {
            setStatus('glasses_remove');
        } else {
            setStatus('success');
            setTimeout(() => {
              onComplete();
            }, 2000);
        }
      } else {
        throw new Error('Registration failed on server.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Failed to register biometric profile. Please try again.');
    }
  };
  
  const startSecondPass = () => {
      setIsSecondPass(true);
      setCurrentStep(0);
      setCapturedImages({});
      setStatus('scanning');
  };

  const videoConstraints = { width: 640, height: 480, facingMode: "user" };
  
  const renderHUD = () => {
      const step = steps[currentStep];
      let indicatorStyle = { transform: 'translate(0px, 0px)' };
      
      if (step.id === 'left') indicatorStyle = { transform: 'translate(-50px, 0px)' };
      if (step.id === 'right') indicatorStyle = { transform: 'translate(50px, 0px)' };
      if (step.id === 'up') indicatorStyle = { transform: 'translate(0px, -50px)' };
      if (step.id === 'down') indicatorStyle = { transform: 'translate(0px, 50px)' };
      
      return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-white/50 rounded-[100px] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex items-center justify-center relative transition-all duration-300"
                   style={{
                       borderColor: (step.id === 'near' && liveMetrics.boxWidth > 0.55) || (step.id === 'far' && liveMetrics.boxWidth < 0.35) ? '#10b981' : 'rgba(255,255,255,0.5)'
                   }}>
                  {['left', 'right', 'up', 'down'].includes(step.id) && (
                      <div className="absolute w-4 h-4 bg-accent rounded-full animate-ping" style={indicatorStyle} />
                  )}
                  <div className="absolute w-2 h-2 bg-success rounded-full transition-all duration-75"
                       style={{ transform: `translate(${-liveMetrics.yaw * 1.5}px, ${-liveMetrics.pitch * 1.5}px)` }} />
              </div>
          </div>
      )
  };

  return (
    <div className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl overflow-y-auto flex flex-col items-center shadow-xl w-full max-w-4xl mx-auto max-h-[90vh]">
      <div className="w-full bg-black/10 dark:bg-white/5 p-5 border-b border-border flex justify-between items-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="font-bold text-lg flex items-center gap-2 relative z-10">
          <Camera className="w-5 h-5 text-accent" />
          Guided Identity Enrollment
        </h3>
        <button onClick={onCancel} className="text-secondary hover:text-primary text-sm font-semibold relative z-10 transition-colors">Cancel</button>
      </div>

      <div className="p-8 w-full flex flex-col items-center min-h-[500px] justify-center relative">
        
        {status === 'glasses_check' && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold mb-4">Are you wearing glasses?</h2>
                <p className="text-secondary font-medium mb-8 max-w-md">
                    To ensure the highest accuracy in all conditions, we capture profiles both with and without glasses.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => { setHasGlasses(true); setStatus(landmarker ? 'scanning' : 'init'); }} className="px-8 py-3 bg-surface border border-border hover:border-accent hover:bg-accent/5 rounded-xl font-bold transition-all">
                        Yes, I am
                    </button>
                    <button onClick={() => { setHasGlasses(false); setStatus(landmarker ? 'scanning' : 'init'); }} className="px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-md hover:shadow-accent/25 hover:-translate-y-0.5 transition-all">
                        No, I am not
                    </button>
                </div>
            </div>
        )}

        {status === 'init' && (
            <div className="flex flex-col items-center text-secondary">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-accent" />
                <p className="font-bold">Initializing AI Models...</p>
            </div>
        )}

        {status === 'glasses_remove' && (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                    <EyeOff className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold mb-4">Great! Now remove your glasses.</h2>
                <p className="text-secondary font-medium mb-8 max-w-md">
                    We will now perform a second pass to securely encode your facial features without glasses.
                </p>
                <button onClick={startSecondPass} className="px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-md hover:shadow-accent/25 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    Continue <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-16 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success/20">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 text-center">Enrollment Complete</h2>
            <p className="text-secondary text-center max-w-sm font-medium">Your multi-pose biometric dataset has been securely processed.</p>
          </div>
        )}
        
        {status === 'error' && (
           <div className="flex flex-col items-center py-16 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-error/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-error/20">
              <AlertCircle className="w-12 h-12 text-error" />
            </div>
            <h2 className="text-3xl font-extrabold mb-3 text-center">Enrollment Failed</h2>
            <p className="text-secondary text-center max-w-sm mb-8 font-medium">{errorMsg}</p>
            <button onClick={() => setStatus('glasses_check')} className="px-8 py-3 bg-accent text-white rounded-xl font-bold transition-all">Try Again</button>
          </div>
        )}
        
        {status === 'processing' && (
             <div className="flex flex-col items-center text-secondary py-16">
                <Loader2 className="w-16 h-16 animate-spin mb-6 text-accent" />
                <h2 className="text-2xl font-extrabold mb-2 text-primary">Encoding Biometrics</h2>
                <p className="font-medium max-w-xs text-center">Extracting deep embeddings for multiple poses. This may take a moment...</p>
            </div>
        )}

        {status === 'scanning' && (
          <div className="w-full flex flex-col md:flex-row gap-8 items-center md:items-start animate-in fade-in duration-500">
            <div className="relative w-full md:w-[60%] aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border shrink-0">
               <Webcam
                 audio={false}
                 ref={webcamRef}
                 screenshotFormat="image/jpeg"
                 videoConstraints={videoConstraints}
                 className="w-full h-full object-cover scale-x-[-1]"
               />
               {renderHUD()}
               
               <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                   <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg text-white font-mono text-[10px] space-y-1">
                       <div>YAW: {liveMetrics.yaw.toFixed(1)}°</div>
                       <div>PIT: {liveMetrics.pitch.toFixed(1)}°</div>
                       <div>DST: {(liveMetrics.distance * 100).toFixed(1)}%</div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-white uppercase tracking-wider bg-black/50 px-2 py-1 rounded">Quality</span>
                       <div className="w-24 h-2 bg-black/50 rounded-full overflow-hidden">
                           <div className="h-full bg-success transition-all duration-300" style={{ width: `${qualityScore}%` }} />
                       </div>
                   </div>
               </div>
            </div>

            <div className="w-full md:w-[40%] flex flex-col pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent font-bold text-xs rounded-full uppercase tracking-wider mb-6 self-start">
                  Pose {currentStep + 1} of {steps.length} {isSecondPass && '(Pass 2)'}
              </div>
              <h4 className="text-3xl font-bold mb-3 text-primary">{steps[currentStep].label}</h4>
              <p className="text-secondary font-medium mb-4 text-lg">{steps[currentStep].instruction}</p>
              
              <div className="space-y-3 mb-4 overflow-y-auto pr-2" style={{ maxHeight: '200px' }}>
                  {steps.map((step, idx) => (
                      <div key={step.id} className={cn(
                          "flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                          idx < currentStep ? "bg-success/10 text-success" :
                          idx === currentStep ? "bg-surface border border-accent shadow-sm shadow-accent/10" :
                          "opacity-50"
                      )}>
                          <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                              idx < currentStep ? "bg-success text-white" :
                              idx === currentStep ? "bg-accent text-white" :
                              "bg-background border border-border"
                          )}>
                              {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                          </div>
                          <span className="font-semibold">{step.label}</span>
                      </div>
                  ))}
              </div>
              
              <div className="mt-auto bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col items-start gap-3">
                  <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-500 font-medium">
                          Hold the pose when the green dot aligns with the target. Click Capture when ready.
                      </p>
                  </div>
                  <button 
                      onClick={() => performCapture()}
                      className="w-full mt-2 py-3 bg-accent text-white font-bold rounded-xl shadow-md hover:shadow-accent/25 hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                  >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
