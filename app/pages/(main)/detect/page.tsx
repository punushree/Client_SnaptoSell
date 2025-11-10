import { useRef, useState, useEffect } from "react";
import {
  Container, Paper, Stack, Title, Text, Button, Group, Center, Alert,
  ActionIcon, Box, Image, SimpleGrid, Card,
  Badge
} from "@mantine/core";
import {
  IconCamera, IconCameraRotate, IconCapture, IconAlertCircle,
  IconTrash, IconUpload
} from "@tabler/icons-react";
import SampleImages from "~/components/SampleImages";
import { IconX } from "@tabler/icons-react";

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
  const [details, setDetails] = useState("");
  const [showSampleImages, setShowSampleImages] = useState(false);

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

  const messages = [
    "1) Capture or upload Front image of divice",
    "2) Capture or upload Back image of divice",
    "3) Capture or upload Left image of divice",
    "4) Capture or upload Right image of divice",
    "5) Capture or upload Setting image of divice"
  ];

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
    setCapturedImages([]); //Clear all images

  };

  //  // Capture image
  // const captureImage = () => {
  //   if (videoRef.current && canvasRef.current) {
  //     const video = videoRef.current;
  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");

  //     if (context) {
  //       canvas.width = video.videoWidth;
  //       canvas.height = video.videoHeight;

  //       // Mirror the image if using front camera
  //       if (facingMode === "user") {
  //         context.translate(canvas.width, 0);
  //         context.scale(-1, 1);
  //       }

  //       context.drawImage(video, 0, 0, canvas.width, canvas.height);

  //       const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  //       //setCapturedImage(imageDataUrl);
  //         setCapturedImages((prev) =>
  //     prev.length < 5 ? [...prev, imageDataUrl] : prev
  //   );    
  //     }
  //   }
  //          //stopCamera();
  // };


  //
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (facingMode === "user") {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);

        setCapturedImages((prev) => {
          const updated = prev.length < 5 ? [...prev, imageDataUrl] : prev;
          // alert(`${messages[updated.length - 1]} Captured ✅`);
          return updated;
        });
      }
    }
  };


  // Delete image
  const deleteImage = (index: number) =>
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));

  // Upload from gallery
  // const handleFileUpload = (e: any) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   const url = URL.createObjectURL(file);
  //   setCapturedImages((prev) =>
  //     prev.length < 5 ? [...prev, url] : prev
  //   );
  // };

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setCapturedImages((prev) => {
      const updated = prev.length < 5 ? [...prev, url] : prev;
      //alert(`${messages[updated.length - 1]} Uploaded ✅`);
      return updated;
    });
  };

  // Switch camera
  const switchCamera = () =>
    //   startCamera(facingMode === "user" ? "environment" : "user");


    // const handleSubmit = () => {
    alert("✅ Images submitted successfully!");
  const handleSubmit = () => {
    if (details.trim() === "") {
      alert("Please enter device details before submitting.");
      return;
    }

    alert("✅ Images and Details Submitted Successfully!");
    console.log("Captured Images:", capturedImages);
    console.log("Details:", details);
  };

  // Show sample images component
  const handleShowSampleImages = () => {
    setShowSampleImages(true);
  };

  return (
    <Container size="full" p="md">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Snap to Detect Product
          </Title>
          <Text c="dimmed">
            Capture a photo of the product to detect it and find its price
          </Text>
          <Text >
            Capture/Upload a minimum 3 to 5 photos of the product.
          </Text>
          <Text>
            Capture/Upload a photos form both sides like front side, back side, left side, right side of the product. Click here for priview sample images
            <Button variant="light" ml="xs" onClick={handleShowSampleImages}>
              Sample Images
            </Button>
          </Text>
          <Text>
            After capture/upload a photos and add product details.
          </Text>
        </div>

        {showSampleImages && (
          <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={4}></Title>
              <Button
                variant="light"
                leftSection={<IconX size={16} />}
                onClick={() => setShowSampleImages(false)}
              >
                Close
              </Button>
            </Group>
            <SampleImages />
          </Paper>
        )}

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
              <Stack gap="md">
                <Group align="flex-start" grow>

                  {/* LEFT SIDE: Camera Preview */}
                  <Box
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 530,
                      aspectRatio: "16 / 9",
                      background: "#000",
                      borderRadius: 8,
                      overflow: "hidden",
                      //flexGrow: 1,  
                    }}
                  >
                    {!isVideoReady && <Text c="white">Loading camera...</Text>}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
                  {/* RIGHT SIDE: Buttons + Images */}
                  <Stack gap="md" align="center" style={{ width: 220 }}>

                    <Group justify="center">
                      <Button leftSection={<IconCapture />} onClick={captureImage} disabled={!isVideoReady}>
                        Capture
                      </Button>

                      <Button variant="light" leftSection={<IconUpload />} onClick={() => fileRef.current?.click()}>
                        Upload
                      </Button>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

                      <Button variant="outline" onClick={stopCamera}>
                        Cancel
                      </Button>
                    </Group>


                    {/* ✅ Captured Images on Right Side Under Buttons */}


                    {capturedImages.length > 0 && (
                      <SimpleGrid cols={2} spacing="sm" style={{ width: "70%" }}>
                        {capturedImages.map((img, index) => (
                          <Card key={index} p={0} radius="md" withBorder style={{ position: "relative" }}>
                            <Image src={img} height={50} fit="cover" />
                            <ActionIcon
                              color="red"
                              variant="filled"
                              radius="xl"
                              p={3}
                              style={{ position: "absolute", top: 6, right: 9 }}
                              onClick={() => deleteImage(index)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </Stack>
                </Group>

                <Text fw={600}>Device / Product Details</Text>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Enter device details..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 6,
                    border: "1px solid #ced4da",
                    fontSize: 14
                  }}
                />

                {capturedImages.length >= 0 && (
                  <Group justify="center">
                    <Button
                      color="green"
                      onClick={handleSubmit}
                      disabled={capturedImages.length < 3 || details.trim() === ""}
                    >
                      Submit Images ({capturedImages.length}/5)
                    </Button>
                  </Group>
                )}
              </Stack>
            )}

          </Stack>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </Paper>
      </Stack>

    </Container>
  );
};

export default Page;
