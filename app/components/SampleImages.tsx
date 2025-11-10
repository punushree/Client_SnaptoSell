import { Container, SimpleGrid, Image, Title, Card } from "@mantine/core";

const SampleImages = () => {
  const samples = [
    "/sampleImages/download.png",
    "/sampleImages/istockphoto.jpg",
  ];

  return (
    <Container py="lg">
      <Title order={2} mb="md">Sample Product Images</Title>

      <SimpleGrid cols={2} spacing="md">
        {samples.map((src, i) => (
          <Card key={i} withBorder p="sm" radius="md">
            <Image src={src} height={200} fit="cover" />
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default SampleImages;
