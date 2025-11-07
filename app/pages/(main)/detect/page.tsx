import { useRef, useState, useEffect } from "react";
import {
  Container, Paper, Stack, Title, Text, Button, Group, Center, Alert,
  ActionIcon, Box, Image, SimpleGrid, Card
} from "@mantine/core";
import {
  IconCamera, IconCameraRotate, IconCapture, IconAlertCircle,
  IconTrash, IconUpload
} from "@tabler/icons-react";

const Page = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Detect mobile
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent));
  }, []);

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const actualMode = isMobile ? mode : "user";

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: actualMode } }
      });

      setStream(mediaStream);
      setFacingMode(actualMode);
      setIsLoading(false);
    } catch (err) {
      setError("Camera permission blocked. Please allow access.");
      setIsLoading(false);
    }
  };

  // Bind stream to <video>
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = () => setIsVideoReady(true);
    }
  }, [stream]);

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


  // Capture Image (Keep camera ON)
  // const captureImage = () => {
  //   if (!videoRef.current || !canvasRef.current) return;

  //   const video = videoRef.current;
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext("2d")!;

  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;

  //   if (facingMode === "user") {
  //     ctx.translate(canvas.width, 0);
  //     ctx.scale(-1, 1);
  //   }

  //   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //   const url = canvas.toDataURL("image/jpeg", 0.95);

  //   setCapturedImages((prev) =>
  //     prev.length < 5 ? [...prev, url] : prev
  //   );



  // };

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
        //setCapturedImage(imageDataUrl);
          setCapturedImages((prev) =>
      prev.length < 5 ? [...prev, imageDataUrl] : prev
    );    
      }
    }
           //stopCamera();
  };

  // Delete image
  const deleteImage = (index: number) =>
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));

  // Upload from gallery
  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImages((prev) =>
      prev.length < 5 ? [...prev, url] : prev
    );
  };

  // Switch camera
  const switchCamera = () =>
    startCamera(facingMode === "user" ? "environment" : "user");


const handleSubmit = () => {
  alert("✅ Images submitted successfully!");
};


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
          <Alert icon={<IconAlertCircle />} color="red">{error}</Alert>
        )}

        <Paper shadow="sm" p="md" withBorder>
          <Stack gap="md">

            {/* Camera UI */}
            {!stream && (
              <Center py="xl">
                <Button leftSection={<IconCamera />} onClick={() => startCamera()} loading={isLoading}>
                  Start Camera
                </Button>
              </Center>
            )}

            {stream && (
              <>
                <Box style={{
                  position: "relative",
                  width: "100%",
                  minHeight: 350,
                  background: "#000",
                  borderRadius: 8,
                  overflow: "hidden",
                }}>
                  {!isVideoReady && <Text c="white">Loading camera...</Text>}
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{
                      width: "100%",
                      display: isVideoReady ? "block" : "none",
                      transform: facingMode === "user" ? "scaleX(-1)" : "none",
                    }}
                  />
                  {isMobile && (
                    <ActionIcon
                      color="blue"
                      variant="filled"
                      onClick={switchCamera}
                      style={{ position: "absolute", top: 12, right: 12 }}
                    >
                      <IconCameraRotate />
                    </ActionIcon>
                  )}
                </Box>

                {/* <Group justify="center">
                  <Button leftSection={<IconCapture />} onClick={captureImage} disabled={!isVideoReady}>
                    Capture
                  </Button>

                  <Button variant="outline" onClick={() => stream?.getTracks().forEach((t) => t.stop())}>
                    Stop
                  </Button>

                  <Button variant="light" leftSection={<IconUpload />} onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                </Group> */}

                <Group justify="center">
                  <Button leftSection={<IconCapture />} onClick={captureImage} disabled={!isVideoReady}>
                    Capture
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>


                  <Button variant="light" leftSection={<IconUpload />} onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                </Group>

              </>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Preview Images */}
            {capturedImages.length > 0 && (
              <SimpleGrid cols={3} spacing="md">
                {capturedImages.map((img, index) => (
                  <Card key={index} p={0} radius="md" withBorder style={{ position: "relative" }}>
                    <Image src={img} height={120} fit="cover" />
                    <ActionIcon color="red" variant="filled" radius="xl" p={4}
                      style={{ position: "absolute", top: 6, right: 6 }}
                      onClick={() => deleteImage(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {capturedImages.length >= 3 && (
              <Button color="green" fullWidth onClick={handleSubmit}>
                Submit Images ({capturedImages.length}/5)
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Page;
