import { NextRequest, NextResponse } from "next/server";
import Exercise from "@/models/Exercise";
import dbConnect from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';

// Gym exercises data
const gymExercises = [
  {
    name: "Barbell Bench Press",
    description: "A compound exercise that primarily targets the chest muscles but also works the shoulders and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    environment: ["gym"],
    difficulty: "intermediate",
    equipment: ["Barbell", "Bench"],
    formTips: [
      "Keep your feet flat on the floor",
      "Maintain a slight arch in your lower back",
      "Lower the bar to the middle of your chest",
      "Keep your elbows at a 45-degree angle from your body"
    ],
    category: "strength"
  },
  {
    name: "Lat Pulldown",
    description: "An exercise that targets the latissimus dorsi muscles of the back",
    muscleGroups: ["Back", "Biceps"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Cable Machine", "Lat Bar"],
    formTips: [
      "Keep your chest up and shoulders back",
      "Pull the bar down to your upper chest",
      "Squeeze your shoulder blades together at the bottom",
      "Control the weight as you return to starting position"
    ],
    category: "strength"
  },
  {
    name: "Leg Press",
    description: "A compound exercise that targets the quadriceps, hamstrings, and glutes",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Leg Press Machine"],
    formTips: [
      "Keep your back against the seat",
      "Don't lock your knees at the top",
      "Place feet shoulder-width apart",
      "Lower the weight until knees form 90 degree angles"
    ],
    category: "strength"
  },
  {
    name: "Shoulder Press Machine",
    description: "An exercise that targets the deltoids and stabilizer muscles in the shoulders",
    muscleGroups: ["Shoulders", "Triceps"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Shoulder Press Machine"],
    formTips: [
      "Adjust the seat so handles align with your shoulders",
      "Keep your back straight against the pad",
      "Push directly upward, not forward",
      "Don't lock your elbows at the top"
    ],
    category: "strength"
  },
  {
    name: "Cable Bicep Curl",
    description: "An isolation exercise targeting the biceps using a cable machine",
    muscleGroups: ["Biceps"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Cable Machine", "Curl Bar Attachment"],
    formTips: [
      "Keep your elbows close to your sides",
      "Don't swing your body",
      "Squeeze biceps at the top",
      "Control the weight during the negative portion"
    ],
    category: "strength"
  },
  {
    name: "Tricep Pushdown",
    description: "An isolation exercise for the triceps using a cable machine",
    muscleGroups: ["Triceps"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Cable Machine", "Straight or V-bar Attachment"],
    formTips: [
      "Keep elbows close to your body",
      "Only move at the elbow joint",
      "Keep your upper arms stationary",
      "Fully extend your arms but don't lock elbows"
    ],
    category: "strength"
  },
  {
    name: "Seated Row",
    description: "A compound exercise that targets the middle back and biceps",
    muscleGroups: ["Back", "Biceps"],
    environment: ["gym"],
    difficulty: "intermediate",
    equipment: ["Cable Machine", "Row Attachment"],
    formTips: [
      "Maintain a straight back",
      "Pull the handle to your abdomen",
      "Squeeze your shoulder blades together",
      "Control the weight on the return"
    ],
    category: "strength"
  },
  {
    name: "Leg Extension",
    description: "An isolation exercise targeting the quadriceps",
    muscleGroups: ["Quadriceps"],
    environment: ["gym"],
    difficulty: "beginner",
    equipment: ["Leg Extension Machine"],
    formTips: [
      "Adjust the machine so your knees align with the pivot point",
      "Don't swing or use momentum",
      "Extend legs fully but don't lock knees",
      "Control the weight during the eccentric phase"
    ],
    category: "strength"
  },
  {
    name: "Squat",
    description: "A fundamental compound exercise targeting the lower body muscles",
    muscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Lower Back"],
    environment: ["home", "gym"],
    difficulty: "intermediate",
    equipment: ["Optional: Barbell, Dumbbells"],
    formTips: [
      "Keep your chest up and back straight",
      "Knees should track over toes",
      "Lower until thighs are parallel to ground",
      "Drive through your heels to stand up"
    ],
    category: "strength"
  },
  {
    name: "Deadlift",
    description: "A compound exercise that works the entire posterior chain",
    muscleGroups: ["Lower Back", "Hamstrings", "Glutes", "Traps"],
    environment: ["gym"],
    difficulty: "advanced",
    equipment: ["Barbell", "Weight Plates"],
    formTips: [
      "Keep your back straight and chest up",
      "Start with weight close to shins",
      "Push through your heels",
      "Keep the bar close to your body throughout movement"
    ],
    category: "strength"
  }
];

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check for admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if exercises already exist
    const count = await Exercise.countDocuments();
    
    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: "Database already has exercises. Skipped seeding.",
        count
      });
    }
    
    // Seed the database with exercises
    await Exercise.insertMany(gymExercises);
    
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with gym exercises",
      count: gymExercises.length
    });
  } catch (error) {
    console.error("Error seeding exercises:", error);
    return NextResponse.json(
      { error: "Failed to seed exercise database" },
      { status: 500 }
    );
  }
}
