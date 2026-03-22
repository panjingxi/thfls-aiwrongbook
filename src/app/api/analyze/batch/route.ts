import { NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { calculateGradeNumber, inferSubjectFromName } from "@/lib/knowledge-tags";
import { prisma } from "@/lib/prisma";
import { badRequest, createErrorResponse, ErrorCode } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:analyze:batch');

export async function POST(req: Request) {
    logger.info('Analyze Batch API called');

    const session = await getServerSession(authOptions);

    // 认证检查
    if (!session) {
        logger.warn('Unauthorized access attempt');
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        let { imageBase64, mimeType, language, subjectId } = body;

        logger.debug({
            imageLength: imageBase64?.length,
            mimeType,
            language,
            subjectId
        }, 'Request received');

        if (!imageBase64) {
            logger.warn('Missing image data');
            return badRequest("Missing image data");
        }

        // Parse Data URL if present
        if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                imageBase64 = matches[2];
            }
        }

        let userGrade: 7 | 8 | 9 | 10 | 11 | 12 | null = null;
        let subjectName: 'math' | 'physics' | 'chemistry' | 'biology' | 'english' | 'chinese' | 'history' | 'geography' | 'politics' | null = null;

        if (session?.user?.email) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { educationStage: true, enrollmentYear: true }
                });

                if (user) {
                    userGrade = calculateGradeNumber(user.educationStage, user.enrollmentYear);
                }

                if (subjectId) {
                    const subject = await prisma.subject.findUnique({
                        where: { id: subjectId },
                        select: { name: true }
                    });

                    if (subject) {
                        subjectName = inferSubjectFromName(subject.name);
                    }
                }
            } catch (error) {
                logger.error({ error }, 'Error fetching user/subject info');
            }
        }

        const subjectNameMapping: Record<string, string> = {
            'math': '数学',
            'physics': '物理',
            'chemistry': '化学',
            'biology': '生物',
            'english': '英语',
            'chinese': '语文',
            'history': '历史',
            'geography': '地理',
            'politics': '政治',
        };
        const subjectChinese = subjectName ? subjectNameMapping[subjectName] : null;

        logger.info({ userGrade, subject: subjectChinese }, 'Calling AI service for batch image analysis');
        const aiService = getAIService();
        
        if (!aiService.analyzeImageBatch) {
            throw new Error("AI provider does not support batch analysis yet");
        }

        const analysisResultArray = await aiService.analyzeImageBatch(imageBase64, mimeType, language, userGrade, subjectChinese);

        logger.info(`AI batch analysis successful, extracted ${analysisResultArray.length} items`);

        return NextResponse.json(analysisResultArray);
    } catch (error: any) {
        logger.error({
            error: error.message,
            stack: error.stack
        }, 'Batch analysis error occurred');

        let errorMessage = error.message || "Failed to analyze image";

        if (error.message && (
            error.message === 'AI_CONNECTION_FAILED' ||
            error.message === 'AI_RESPONSE_ERROR' ||
            error.message.includes('AI_AUTH_ERROR') ||
            error.message === 'AI_TIMEOUT_ERROR' ||
            error.message === 'AI_QUOTA_EXCEEDED' ||
            error.message === 'AI_PERMISSION_DENIED' ||
            error.message === 'AI_NOT_FOUND' ||
            error.message === 'AI_SERVICE_UNAVAILABLE' ||
            error.message === 'AI_UNKNOWN_ERROR'
        )) {
            if (error.message.includes('AI_AUTH_ERROR')) {
                errorMessage = 'AI_AUTH_ERROR';
            } else {
                errorMessage = error.message;
            }
        } else if (error.message?.includes('Zod') || error.message?.includes('validate')) {
            errorMessage = 'AI_RESPONSE_ERROR';
        }

        return createErrorResponse(errorMessage, 500, ErrorCode.AI_ERROR, error.message);
    }
}
