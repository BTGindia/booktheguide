-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'GUIDE_MANAGER', 'GUIDE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'AWAITING_QUOTE', 'QUOTE_SENT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('FIXED_DEPARTURE', 'PERSONAL_BOOKING');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MODERATE', 'DIFFICULT', 'EXTREME');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TREKKING', 'CAMPING', 'MOUNTAINEERING', 'CITY_TOUR', 'HILL_STATION', 'PILGRIMAGE', 'WILDLIFE_SAFARI', 'ADVENTURE_SPORT', 'CULTURAL_TOUR', 'FOOD_TOUR', 'PHOTOGRAPHY_TOUR', 'PARAGLIDING', 'RAFTING', 'SKIING', 'PET_FRIENDLY', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideManagerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideManagerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "tagline" TEXT,
    "experienceYears" INTEGER DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "education" TEXT,
    "certifications" TEXT[],
    "languages" TEXT[],
    "specializations" TEXT[],
    "specializationProofs" JSONB NOT NULL DEFAULT '[]',
    "idType" TEXT,
    "idNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "portfolioImages" TEXT[],
    "coverImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideServiceArea" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndianState" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isNorthIndia" BOOLEAN NOT NULL DEFAULT false,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndianState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "description" TEXT,
    "altitude" INTEGER,
    "bestMonths" TEXT[],
    "openMonths" TEXT[],
    "avoidMonths" TEXT[],
    "coverImage" TEXT,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "activityType" TEXT NOT NULL DEFAULT 'TREKKING',
    "packageCategory" TEXT NOT NULL DEFAULT 'TOURIST_GUIDES',
    "difficultyLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "durationDays" INTEGER NOT NULL,
    "durationNights" INTEGER NOT NULL,
    "isPetFriendly" BOOLEAN NOT NULL DEFAULT false,
    "itinerary" JSONB NOT NULL DEFAULT '[]',
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "cancellationPolicy" JSONB NOT NULL DEFAULT '[]',
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "coverImage" TEXT,
    "images" TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedDeparture" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "maxGroupSize" INTEGER NOT NULL DEFAULT 15,
    "minGroupSize" INTEGER NOT NULL DEFAULT 1,
    "genderPolicy" TEXT NOT NULL DEFAULT 'MIXED',
    "pricingTiers" JSONB NOT NULL DEFAULT '{}',
    "pricePerPerson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "petPricing" JSONB NOT NULL DEFAULT '{}',
    "commissionPercent" DOUBLE PRECISION,
    "cgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "sgstPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "meetingPoint" TEXT,
    "endingPoint" TEXT,
    "meetingTime" TEXT,
    "notes" TEXT,
    "approvalStatus" "DepartureStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideAvailability" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL,
    "fixedDepartureId" TEXT,
    "productId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "guestDetails" JSONB,
    "meetingPoint" TEXT,
    "destinationName" TEXT,
    "requirements" JSONB,
    "packageDetails" JSONB,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "guideId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "knowledgeRating" INTEGER,
    "communicationRating" INTEGER,
    "valueForMoneyRating" INTEGER,
    "safetyRating" INTEGER,
    "comment" TEXT,
    "isAdminReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateTripInquiry" (
    "id" TEXT NOT NULL,
    "organizationType" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "groupSize" INTEGER NOT NULL,
    "preferredStateId" TEXT,
    "approxDays" INTEGER NOT NULL,
    "additionalNotes" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateTripInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdminManagedStates" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ServiceAreaCities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideManagerProfile_userId_key" ON "GuideManagerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_slug_key" ON "GuideProfile"("slug");

-- CreateIndex
CREATE INDEX "GuideProfile_slug_idx" ON "GuideProfile"("slug");

-- CreateIndex
CREATE INDEX "GuideProfile_averageRating_idx" ON "GuideProfile"("averageRating");

-- CreateIndex
CREATE INDEX "GuideProfile_isActive_isVerified_idx" ON "GuideProfile"("isActive", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "GuideServiceArea_guideId_stateId_key" ON "GuideServiceArea"("guideId", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "IndianState_name_key" ON "IndianState"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndianState_code_key" ON "IndianState"("code");

-- CreateIndex
CREATE INDEX "IndianState_isNorthIndia_idx" ON "IndianState"("isNorthIndia");

-- CreateIndex
CREATE INDEX "City_stateId_idx" ON "City"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_stateId_key" ON "City"("name", "stateId");

-- CreateIndex
CREATE INDEX "Region_stateId_idx" ON "Region"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_stateId_key" ON "Region"("name", "stateId");

-- CreateIndex
CREATE INDEX "Destination_cityId_idx" ON "Destination"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_cityId_key" ON "Destination"("name", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_guideId_idx" ON "Product"("guideId");

-- CreateIndex
CREATE INDEX "Product_destinationId_idx" ON "Product"("destinationId");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "FixedDeparture_productId_idx" ON "FixedDeparture"("productId");

-- CreateIndex
CREATE INDEX "FixedDeparture_startDate_idx" ON "FixedDeparture"("startDate");

-- CreateIndex
CREATE INDEX "FixedDeparture_isActive_idx" ON "FixedDeparture"("isActive");

-- CreateIndex
CREATE INDEX "FixedDeparture_approvalStatus_idx" ON "FixedDeparture"("approvalStatus");

-- CreateIndex
CREATE INDEX "GuideAvailability_guideId_idx" ON "GuideAvailability"("guideId");

-- CreateIndex
CREATE INDEX "GuideAvailability_date_idx" ON "GuideAvailability"("date");

-- CreateIndex
CREATE INDEX "GuideAvailability_isAvailable_idx" ON "GuideAvailability"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "GuideAvailability_guideId_date_key" ON "GuideAvailability"("guideId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_guideId_idx" ON "Booking"("guideId");

-- CreateIndex
CREATE INDEX "Booking_bookingNumber_idx" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_tripType_idx" ON "Booking"("tripType");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_guideId_idx" ON "Review"("guideId");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_key_key" ON "PlatformSettings"("key");

-- CreateIndex
CREATE INDEX "CorporateTripInquiry_isResolved_idx" ON "CorporateTripInquiry"("isResolved");

-- CreateIndex
CREATE INDEX "CorporateTripInquiry_createdAt_idx" ON "CorporateTripInquiry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_AdminManagedStates_AB_unique" ON "_AdminManagedStates"("A", "B");

-- CreateIndex
CREATE INDEX "_AdminManagedStates_B_index" ON "_AdminManagedStates"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceAreaCities_AB_unique" ON "_ServiceAreaCities"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceAreaCities_B_index" ON "_ServiceAreaCities"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideManagerProfile" ADD CONSTRAINT "GuideManagerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideServiceArea" ADD CONSTRAINT "GuideServiceArea_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideServiceArea" ADD CONSTRAINT "GuideServiceArea_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "IndianState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "IndianState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "IndianState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedDeparture" ADD CONSTRAINT "FixedDeparture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedDeparture" ADD CONSTRAINT "FixedDeparture_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideAvailability" ADD CONSTRAINT "GuideAvailability_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fixedDepartureId_fkey" FOREIGN KEY ("fixedDepartureId") REFERENCES "FixedDeparture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateTripInquiry" ADD CONSTRAINT "CorporateTripInquiry_preferredStateId_fkey" FOREIGN KEY ("preferredStateId") REFERENCES "IndianState"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminManagedStates" ADD CONSTRAINT "_AdminManagedStates_A_fkey" FOREIGN KEY ("A") REFERENCES "AdminProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminManagedStates" ADD CONSTRAINT "_AdminManagedStates_B_fkey" FOREIGN KEY ("B") REFERENCES "IndianState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceAreaCities" ADD CONSTRAINT "_ServiceAreaCities_A_fkey" FOREIGN KEY ("A") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceAreaCities" ADD CONSTRAINT "_ServiceAreaCities_B_fkey" FOREIGN KEY ("B") REFERENCES "GuideServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
