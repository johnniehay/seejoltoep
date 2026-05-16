import type { Endpoint } from 'payload';
import { APIError } from 'payload';
import type { User } from '@/payload-types';
import { z } from 'zod';

// Define the schema for the request body
const KennisgewingLogUpdateSchema = z.object({
  shown: z.boolean().optional(),
  acknowledged: z.boolean().optional(),
  viewed_details: z.boolean().optional(),
  closed: z.boolean().optional(),
  //actionTaken: z.string().optional(),
}).strict(); // Use .strict() to disallow unknown keys

export const updateKennisgewingLog: Endpoint = {
  path: '/:kennisgewingId/update',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!req.routeParams){
      return Response.json({ error: 'Missing route parameters.' }, { status: 400 })
    }

    const kennisgewingId: string = req.routeParams.kennisgewingId as string
    const userId = (req.user as User).id;

    if (!kennisgewingId) {
      return Response.json({ message: 'Missing kennisgewingId in URL.' }, { status: 400 });
    }

    let validatedBody
    try {
      validatedBody = KennisgewingLogUpdateSchema.parse(await req.json?.());
    } catch (error: any) {
      return Response.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }

    // If the validated body is empty, there's nothing to update
    if (Object.keys(validatedBody).length === 0) {
      return Response.json({ message: 'No valid fields provided for update.' }, { status: 400 });
    }

    const payload = req.payload

    try {
      // Check if Kennisgewing exists, will throw if not
      const kennisgewing = await payload.findByID({collection: 'kennisgewings', id: kennisgewingId, depth:0})

      // Find existing log entry
      const existingLogs = await req.payload.find({
        collection: 'kennisgewingLogs',
        where: {
          kennisgewing: { equals: kennisgewing.id },
          user: { equals: userId },
        },
        limit: 1,
        req, // Pass req for transaction safety
      });

      let updatedDoc;

      if (existingLogs.docs.length > 0) {
        // Update existing entry
        updatedDoc = await payload.update({
          collection: 'kennisgewingLogs',
          id: existingLogs.docs[0].id,
          data: validatedBody,
          depth: 0,
          req, // Pass req for transaction safety
        });
      } else {
        // Create new entry
        updatedDoc = await payload.create({
          collection: 'kennisgewingLogs',
          data: {
            kennisgewing: kennisgewingId,
            user: userId,
            ...validatedBody, // Apply the specific updates
          },
          depth: 0,
          req, // Pass req for transaction safety
        });
      }

      return Response.json(updatedDoc, { status: 200 });

    } catch (error: unknown) {
      payload.logger.error({
        msg: 'Error updating or creating KennisgewingLog',
        error,
        kennisgewingId,
        userId,
        validatedBody,
      });
      if (error instanceof APIError) {
        return Response.json({ message: error.message }, { status: error.status });
      }
      return Response.json({ message: 'Internal server error' }, { status: 500 });
    }
  },
};
