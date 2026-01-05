/**
 * Create Listing Page
 * Multi-marketplace listing creation interface
 * Supports Amazon, Facebook Marketplace, and eBay
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  FileInput,
  Stepper,
  Card,
  Badge,
  Alert,
  Grid,
  Divider,
  ActionIcon,
  Image,
  Box,
  Tabs,
  Switch,
} from "@mantine/core";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconShoppingCart,
  IconBrandFacebook,
  IconBrandAmazon,
  IconPackage,
  IconCurrencyDollar,
  IconInfoCircle,
} from "@tabler/icons-react";

interface ListingImage {
  file: File;
  preview: string;
}

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Marketplace selection
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);

  // Product details
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState("");

  // Images
  const [images, setImages] = useState<ListingImage[]>([]);

  // Pricing & shipping
  const [price, setPrice] = useState<number | undefined>();
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number>(1);
  const [shippingPrice, setShippingPrice] = useState<number | undefined>();
  const [offerFreeShipping, setOfferFreeShipping] = useState(false);
  const [acceptOffers, setAcceptOffers] = useState(false);

  // Platform-specific fields
  const [amazonSKU, setAmazonSKU] = useState("");
  const [ebayDuration, setEbayDuration] = useState("7");
  const [facebookLocation, setFacebookLocation] = useState("");

  const marketplaceOptions = [
    { value: "amazon", label: "Amazon", icon: IconBrandAmazon, color: "#FF9900" },
    { value: "ebay", label: "eBay", icon: IconShoppingCart, color: "#E53238" },
    { value: "facebook", label: "Facebook Marketplace", icon: IconBrandFacebook, color: "#1877F2" },
  ];

  const categoryOptions = [
    { value: "electronics", label: "Electronics" },
    { value: "fashion", label: "Fashion & Apparel" },
    { value: "home", label: "Home & Garden" },
    { value: "sports", label: "Sports & Outdoors" },
    { value: "toys", label: "Toys & Games" },
    { value: "books", label: "Books & Media" },
    { value: "automotive", label: "Automotive" },
    { value: "other", label: "Other" },
  ];

  const conditionOptions = [
    { value: "new", label: "New" },
    { value: "like-new", label: "Like New" },
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ];

  const handleImageUpload = (files: File[]) => {
    const newImages: ListingImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = () => {
    // This will be implemented later with actual API calls
    console.log("Submitting listing:", {
      marketplaces: selectedMarketplaces,
      product: {
        title: productTitle,
        description: productDescription,
        category,
        brand,
        model,
        condition,
      },
      pricing: {
        price,
        compareAtPrice,
        quantity,
        shippingPrice,
        offerFreeShipping,
        acceptOffers,
      },
      images: images.length,
    });
  };

  const nextStep = () => setActiveStep((current) => Math.min(current + 1, 3));
  const prevStep = () => setActiveStep((current) => Math.max(current - 1, 0));

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Create Marketplace Listing</Title>
          <Text c="dimmed" mt="xs">
            List your product on multiple marketplaces simultaneously
          </Text>
        </div>

        {/* Progress Stepper */}
        <Paper shadow="sm" p="xl" withBorder>
          <Stepper active={activeStep} onStepClick={setActiveStep}>
            <Stepper.Step
              label="Marketplace"
              description="Select platforms"
              icon={<IconShoppingCart size={18} />}
            />
            <Stepper.Step
              label="Product Details"
              description="Add product info"
              icon={<IconPackage size={18} />}
            />
            <Stepper.Step
              label="Images & Media"
              description="Upload photos"
              icon={<IconPhoto size={18} />}
            />
            <Stepper.Step
              label="Pricing & Shipping"
              description="Set your price"
              icon={<IconCurrencyDollar size={18} />}
            />
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Paper shadow="sm" p="xl" withBorder>
          {/* Step 0: Marketplace Selection */}
          {activeStep === 0 && (
            <Stack gap="xl">
              <div>
                <Title order={3} mb="md">Select Marketplaces</Title>
                <Text c="dimmed" size="sm" mb="lg">
                  Choose where you want to list your product. You can select multiple platforms.
                </Text>
              </div>

              <Grid>
                {marketplaceOptions.map((marketplace) => {
                  const Icon = marketplace.icon;
                  const isSelected = selectedMarketplaces.includes(marketplace.value);

                  return (
                    <Grid.Col key={marketplace.value} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card
                        shadow="sm"
                        padding="lg"
                        withBorder
                        style={{
                          cursor: "pointer",
                          borderColor: isSelected ? marketplace.color : undefined,
                          borderWidth: isSelected ? 2 : 1,
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMarketplaces(
                              selectedMarketplaces.filter((m) => m !== marketplace.value)
                            );
                          } else {
                            setSelectedMarketplaces([...selectedMarketplaces, marketplace.value]);
                          }
                        }}
                      >
                        <Stack align="center" gap="md">
                          <Icon size={48} color={marketplace.color} />
                          <Text fw={600} size="lg">
                            {marketplace.label}
                          </Text>
                          {isSelected && (
                            <Badge color="green" variant="filled" leftSection={<IconCheck size={14} />}>
                              Selected
                            </Badge>
                          )}
                        </Stack>
                      </Card>
                    </Grid.Col>
                  );
                })}
              </Grid>

              {selectedMarketplaces.length === 0 && (
                <Alert icon={<IconAlertCircle />} color="blue" variant="light">
                  Please select at least one marketplace to continue
                </Alert>
              )}
            </Stack>
          )}

          {/* Step 1: Product Details */}
          {activeStep === 1 && (
            <Stack gap="lg">
              <div>
                <Title order={3} mb="md">Product Information</Title>
                <Text c="dimmed" size="sm">
                  Provide detailed information about your product
                </Text>
              </div>

              <TextInput
                label="Product Title"
                placeholder="e.g., Apple iPhone 13 Pro Max 256GB - Pacific Blue"
                required
                value={productTitle}
                onChange={(e) => setProductTitle(e.currentTarget.value)}
                description="Be specific and include brand, model, and key features"
              />

              <Textarea
                label="Product Description"
                placeholder="Describe your product in detail..."
                required
                minRows={6}
                value={productDescription}
                onChange={(e) => setProductDescription(e.currentTarget.value)}
                description="Include condition details, features, and any defects"
              />

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Category"
                    placeholder="Select category"
                    required
                    data={categoryOptions}
                    value={category}
                    onChange={(value) => setCategory(value || "")}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Condition"
                    placeholder="Select condition"
                    required
                    data={conditionOptions}
                    value={condition}
                    onChange={(value) => setCondition(value || "")}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Brand"
                    placeholder="e.g., Apple, Samsung, Nike"
                    value={brand}
                    onChange={(e) => setBrand(e.currentTarget.value)}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Model"
                    placeholder="e.g., iPhone 13 Pro Max"
                    value={model}
                    onChange={(e) => setModel(e.currentTarget.value)}
                  />
                </Grid.Col>
              </Grid>

              {/* Platform-specific fields */}
              {selectedMarketplaces.length > 0 && (
                <>
                  <Divider label="Platform-Specific Details" />

                  <Tabs defaultValue={selectedMarketplaces[0]}>
                    <Tabs.List>
                      {selectedMarketplaces.map((marketplace) => {
                        const option = marketplaceOptions.find((m) => m.value === marketplace);
                        return (
                          <Tabs.Tab key={marketplace} value={marketplace}>
                            {option?.label}
                          </Tabs.Tab>
                        );
                      })}
                    </Tabs.List>

                    {selectedMarketplaces.includes("amazon") && (
                      <Tabs.Panel value="amazon" pt="md">
                        <Stack gap="md">
                          <TextInput
                            label="Amazon SKU"
                            placeholder="Product SKU (optional)"
                            value={amazonSKU}
                            onChange={(e) => setAmazonSKU(e.currentTarget.value)}
                            description="Stock Keeping Unit for inventory management"
                          />
                        </Stack>
                      </Tabs.Panel>
                    )}

                    {selectedMarketplaces.includes("ebay") && (
                      <Tabs.Panel value="ebay" pt="md">
                        <Stack gap="md">
                          <Select
                            label="Listing Duration"
                            data={[
                              { value: "1", label: "1 Day" },
                              { value: "3", label: "3 Days" },
                              { value: "7", label: "7 Days" },
                              { value: "10", label: "10 Days" },
                              { value: "30", label: "30 Days" },
                            ]}
                            value={ebayDuration}
                            onChange={(value) => setEbayDuration(value || "7")}
                            description="How long your listing will be active"
                          />
                        </Stack>
                      </Tabs.Panel>
                    )}

                    {selectedMarketplaces.includes("facebook") && (
                      <Tabs.Panel value="facebook" pt="md">
                        <Stack gap="md">
                          <TextInput
                            label="Pickup Location"
                            placeholder="City, State"
                            value={facebookLocation}
                            onChange={(e) => setFacebookLocation(e.currentTarget.value)}
                            description="Where buyers can pick up the item"
                          />
                        </Stack>
                      </Tabs.Panel>
                    )}
                  </Tabs>
                </>
              )}
            </Stack>
          )}

          {/* Step 2: Images */}
          {activeStep === 2 && (
            <Stack gap="lg">
              <div>
                <Title order={3} mb="md">Product Images</Title>
                <Text c="dimmed" size="sm">
                  Upload high-quality images of your product (up to 10 images)
                </Text>
              </div>

              <FileInput
                label="Upload Images"
                placeholder="Click to upload or drag and drop"
                multiple
                accept="image/*"
                leftSection={<IconUpload size={18} />}
                onChange={(files) => {
                  if (files && files.length > 0) {
                    handleImageUpload(Array.from(files));
                  }
                }}
                disabled={images.length >= 10}
              />

              {images.length > 0 && (
                <div>
                  <Text fw={500} mb="md">
                    Uploaded Images ({images.length}/10)
                  </Text>
                  <Grid>
                    {images.map((image, index) => (
                      <Grid.Col key={index} span={{ base: 6, sm: 4, md: 3 }}>
                        <Box pos="relative">
                          <Image
                            src={image.preview}
                            alt={`Product ${index + 1}`}
                            height={150}
                            fit="cover"
                            radius="md"
                          />
                          <ActionIcon
                            color="red"
                            variant="filled"
                            pos="absolute"
                            top={5}
                            right={5}
                            onClick={() => removeImage(index)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                          {index === 0 && (
                            <Badge
                              color="blue"
                              variant="filled"
                              pos="absolute"
                              bottom={5}
                              left={5}
                            >
                              Main Image
                            </Badge>
                          )}
                        </Box>
                      </Grid.Col>
                    ))}
                  </Grid>
                </div>
              )}

              {images.length === 0 && (
                <Alert icon={<IconAlertCircle />} color="blue" variant="light">
                  Add at least one image to continue. The first image will be used as the main listing photo.
                </Alert>
              )}

              <Alert icon={<IconInfoCircle />} color="cyan" variant="light">
                <Text size="sm" fw={500} mb="xs">
                  Tips for great product photos:
                </Text>
                <Text size="sm" component="ul" ml="md">
                  <li>Use good lighting and clear backgrounds</li>
                  <li>Show the product from multiple angles</li>
                  <li>Include close-ups of any defects or special features</li>
                  <li>First image should be the main product view</li>
                </Text>
              </Alert>
            </Stack>
          )}

          {/* Step 3: Pricing & Shipping */}
          {activeStep === 3 && (
            <Stack gap="lg">
              <div>
                <Title order={3} mb="md">Pricing & Shipping</Title>
                <Text c="dimmed" size="sm">
                  Set your price and shipping options
                </Text>
              </div>

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Selling Price"
                    placeholder="0.00"
                    required
                    prefix="$"
                    decimalScale={2}
                    min={0}
                    value={price}
                    onChange={(value) => setPrice(typeof value === 'number' ? value : undefined)}
                    description="Your asking price"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Compare at Price (Optional)"
                    placeholder="0.00"
                    prefix="$"
                    decimalScale={2}
                    min={0}
                    value={compareAtPrice}
                    onChange={(value) => setCompareAtPrice(typeof value === 'number' ? value : undefined)}
                    description="Original retail price for comparison"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Quantity Available"
                    placeholder="1"
                    required
                    min={1}
                    value={quantity}
                    onChange={(value) => setQuantity(typeof value === 'number' ? value : 1)}
                    description="How many units do you have?"
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Shipping Price"
                    placeholder="0.00"
                    prefix="$"
                    decimalScale={2}
                    min={0}
                    value={shippingPrice}
                    onChange={(value) => setShippingPrice(typeof value === 'number' ? value : undefined)}
                    description="Shipping cost to buyer"
                    disabled={offerFreeShipping}
                  />
                </Grid.Col>
              </Grid>

              <Stack gap="md">
                <Switch
                  label="Offer Free Shipping"
                  description="Attract more buyers with free shipping"
                  checked={offerFreeShipping}
                  onChange={(e) => setOfferFreeShipping(e.currentTarget.checked)}
                />

                <Switch
                  label="Accept Offers"
                  description="Allow buyers to make offers below your asking price"
                  checked={acceptOffers}
                  onChange={(e) => setAcceptOffers(e.currentTarget.checked)}
                />
              </Stack>

              <Divider />

              {/* Pricing Summary */}
              <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text fw={600} mb="md">
                  Pricing Summary
                </Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">Selling Price:</Text>
                    <Text size="sm" fw={500}>
                      ${price?.toFixed(2) || "0.00"}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Shipping:</Text>
                    <Text size="sm" fw={500}>
                      {offerFreeShipping ? "FREE" : `$${shippingPrice?.toFixed(2) || "0.00"}`}
                    </Text>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text fw={600}>Total (Buyer Pays):</Text>
                    <Text fw={600} c="green" size="lg">
                      ${((price || 0) + (offerFreeShipping ? 0 : shippingPrice || 0)).toFixed(2)}
                    </Text>
                  </Group>
                </Stack>
              </Paper>

              {selectedMarketplaces.length > 0 && (
                <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                  <Text size="sm" fw={500} mb="xs">
                    Selected Marketplaces:
                  </Text>
                  <Group gap="xs">
                    {selectedMarketplaces.map((marketplace) => {
                      const option = marketplaceOptions.find((m) => m.value === marketplace);
                      return (
                        <Badge key={marketplace} color="blue" variant="light">
                          {option?.label}
                        </Badge>
                      );
                    })}
                  </Group>
                </Alert>
              )}
            </Stack>
          )}

          {/* Navigation Buttons */}
          <Group justify="space-between" mt="xl">
            <Button
              variant="default"
              onClick={activeStep === 0 ? () => navigate(-1) : prevStep}
            >
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>

            <Group>
              {activeStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (activeStep === 0 && selectedMarketplaces.length === 0) ||
                    (activeStep === 1 && (!productTitle || !productDescription || !category || !condition)) ||
                    (activeStep === 2 && images.length === 0)
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!price || price <= 0}
                  leftSection={<IconCheck size={18} />}
                  color="green"
                >
                  Create Listing
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* Help Section */}
        <Alert icon={<IconInfoCircle />} color="blue" variant="light">
          <Text size="sm">
            <strong>Need help?</strong> Make sure to provide accurate information and high-quality images 
            to increase your chances of selling. Different marketplaces may have specific requirements.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
};

export default CreateListingPage;
