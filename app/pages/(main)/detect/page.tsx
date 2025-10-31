import { useRef, useState, useEffect } from "react";
import type { FC } from "react";
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Center,
  Alert,
  ActionIcon,
  Box,
  Image,
} from "@mantine/core";
import {
  IconCamera,
  IconCameraRotate,
  IconCapture,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";

const Page: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsVideoReady(false);

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // For desktop/laptop, always use "user" (front camera/webcam)
      const actualMode = isMobile ? mode : "user";

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: actualMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setFacingMode(actualMode);
      setStream(mediaStream); // This will trigger video element to render
      setIsLoading(false);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Unable to access camera. Please ensure you have granted camera permissions."
      );
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  // Switch camera (mobile only)
  const switchCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    startCamera(newMode);
  };

  // Capture image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the image if using front camera
        if (facingMode === "user") {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Handle upload/process
  const handleProcess = async () => {
    if (!capturedImage) return;

    // TODO: Implement your API call here to process the image
    console.log("Processing image for product detection...");
    // Example:
    // const response = await fetch('/api/detect-product', {
    //   method: 'POST',
    //   body: JSON.stringify({ image: capturedImage }),
    // });
  };

  // Effect to attach stream to video element when it becomes available
  useEffect(() => {
    if (stream && videoRef.current) {
      // Always update srcObject when stream changes (for camera switching)
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      
      // Wait for video to start playing
      const handleCanPlay = () => {
        setIsVideoReady(true);
      };
      
      videoRef.current.addEventListener('canplay', handleCanPlay);
      
      // Fallback timeout
      const timeout = setTimeout(() => {
        setIsVideoReady(true);
      }, 1000);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleCanPlay);
        }
        clearTimeout(timeout);
      };
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all tracks when component unmounts (user navigates away)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <Container size="lg" py="xs">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Snap to Detect Product
          </Title>
          <Text c="dimmed">
            Capture a photo of the product to detect it and find its price
          </Text>
        </div>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="md">
            {!stream && !capturedImage && (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconCamera size={64} stroke={1.5} />
                  <Button
                    size="lg"
                    leftSection={<IconCamera size={20} />}
                    onClick={() => startCamera()}
                    loading={isLoading}
                  >
                    Start Camera
                  </Button>
                </Stack>
              </Center>
            )}

            {stream && !capturedImage && (
              <>
                <Box
                  style={{
                    position: "relative",
                    width: "100%",
                    minHeight: "400px",
                    overflow: "hidden",
                    borderRadius: "8px",
                    backgroundColor: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!isVideoReady && (
                    <Text c="white" size="sm">
                      Loading camera...
                    </Text>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "80vh",
                      display: isVideoReady ? "block" : "none",
                      transform: facingMode === "user" ? "scaleX(-1)" : "none",
                    }}
                  />

                  {isMobile && isVideoReady && (
                    <ActionIcon
                      size="lg"
                      variant="filled"
                      color="blue"
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                      }}
                      onClick={switchCamera}
                    >
                      <IconCameraRotate size={20} />
                    </ActionIcon>
                  )}
                </Box>

                <Group justify="center" gap="md">
                  <Button
                    size="lg"
                    leftSection={<IconCapture size={20} />}
                    onClick={captureImage}
                    disabled={!isVideoReady}
                  >
                    Capture Photo
                  </Button>
                  <Button size="lg" variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </Group>
              </>
            )}

            {capturedImage && (
              <>
                <Box
                  style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                    borderRadius: "8px",
                  }}
                >
                  <Image
                    src={capturedImage}
                    alt="Captured product"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </Box>

                <Group justify="center" gap="md">
                  <Button
                    size="lg"
                    leftSection={<IconCheck size={20} />}
                    onClick={handleProcess}
                  >
                    Detect Product
                  </Button>
                  <Button size="lg" variant="outline" onClick={retakePhoto}>
                    Retake Photo
                  </Button>
                </Group>
              </>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </Stack>
        </Paper>

        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text fw={500} size="sm">
              Tips for best results:
            </Text>
            <Text size="sm" c="dimmed">
              • Ensure good lighting
            </Text>
            <Text size="sm" c="dimmed">
              • Keep the product centered in frame
            </Text>
            <Text size="sm" c="dimmed">
              • Avoid blurry images
            </Text>
            <Text size="sm" c="dimmed">
              • Include the entire product in the shot
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Page;
