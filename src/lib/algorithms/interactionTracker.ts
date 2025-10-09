/**
 * Interaction Tracker
 * Automatically records user interactions for algorithm training
 */

import { recordInteraction } from "./helpers";
import { getInteractionWeight } from "./userInterestVector";

export interface TrackInteractionParams {
  userId: string;
  contentId: string;
  contentType: "post" | "comment" | "community";
  interactionType: "VIEW" | "LIKE" | "COMMENT" | "SHARE" | "ECHO";
  subject?: string;
  grade?: string;
}

/**
 * Track user interaction
 * Call this whenever a user interacts with content
 */
export async function trackInteraction(
  params: TrackInteractionParams,
): Promise<void> {
  const { userId, contentId, contentType, interactionType, subject, grade } =
    params;

  try {
    const weight = getInteractionWeight(interactionType);

    await recordInteraction(
      userId,
      contentId,
      contentType,
      interactionType,
      subject,
      grade,
      weight,
    );
  } catch (error) {
    // Don't throw - interaction tracking shouldn't break app
    console.error("Failed to track interaction:", error);
  }
}

/**
 * Track post view
 * Call when user views a post
 */
export async function trackPostView(
  userId: string,
  postId: string,
  subject?: string,
  grade?: string,
): Promise<void> {
  await trackInteraction({
    userId,
    contentId: postId,
    contentType: "post",
    interactionType: "VIEW",
    subject,
    grade,
  });
}

/**
 * Track post like
 * Call when user likes a post
 */
export async function trackPostLike(
  userId: string,
  postId: string,
  subject?: string,
  grade?: string,
): Promise<void> {
  await trackInteraction({
    userId,
    contentId: postId,
    contentType: "post",
    interactionType: "LIKE",
    subject,
    grade,
  });
}

/**
 * Track post comment
 * Call when user comments on a post
 */
export async function trackPostComment(
  userId: string,
  postId: string,
  subject?: string,
  grade?: string,
): Promise<void> {
  await trackInteraction({
    userId,
    contentId: postId,
    contentType: "post",
    interactionType: "COMMENT",
    subject,
    grade,
  });
}

/**
 * Track post echo (share/repost)
 * Call when user echoes a post
 */
export async function trackPostEcho(
  userId: string,
  postId: string,
  subject?: string,
  grade?: string,
): Promise<void> {
  await trackInteraction({
    userId,
    contentId: postId,
    contentType: "post",
    interactionType: "ECHO",
    subject,
    grade,
  });
}
