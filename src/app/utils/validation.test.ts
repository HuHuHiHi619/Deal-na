import { describe, expect, it } from "vitest";
import { validateForm } from "./validateForm";

describe('validaitonForm' , () => {
    describe('valid cases' , () => {
        it('returns valid true with trimmed title and options' , () => {
            const result = validateForm('Test title' , ['option 1' , 'option 2'])

            expect(result.valid).toBe(true)
            expect(result.options).toEqual(['option 1' , 'option 2'])
            expect(result.error).toBeUndefined()
        })

        it('handles single option' , () => {
            const result = validateForm('test' , ['option'])

            expect(result.valid).toBe(true)
        })
    })

    describe('invalid cases' , () => {
        it('returns valid false with empty title' , () => {
            const result = validateForm('',['option'])

            expect(result.valid).toBe(false)
            expect(result.error).toBe('Title is required')
        })

         it("returns error for whitespace-only title", () => {
      const result = validateForm("   ", ["Option 1"]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Title is required");
    });

        it('returns error for empty options array', () => {
            const result = validateForm('test' , [])

            expect(result.valid).toBe(false)
            expect(result.error).toBe('Options are required at least 1')
        })

        it('returns error for all empty options' , () => {
            const result = validateForm('test' , ['' , ''])
            expect(result.valid).toBe(false)
            expect(result.error).toBe('Options are required at least 1')
        })

        
    })
})