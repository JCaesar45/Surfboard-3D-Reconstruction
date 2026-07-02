"""
Surfboard 3D Reconstruction - Python/PyOpenGL
Run: pip install pygame PyOpenGL PyOpenGL_accelerate
"""

import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *
from OpenGL.GLUT import *
import numpy as np
import math

# --- Scene Setup ---
class SurfboardScene:
    def __init__(self):
        pygame.init()
        self.width, self.height = 800, 600
        self.screen = pygame.display.set_mode(
            (self.width, self.height), 
            DOUBLEBUF | OPENGL
        )
        pygame.display.set_caption("Surfboard 3D - Python")
        
        # Camera
        glMatrixMode(GL_PROJECTION)
        glLoadIdentity()
        gluPerspective(35, self.width/self.height, 0.1, 100)
        glMatrixMode(GL_MODELVIEW)
        gluLookAt(3.2, 1.8, 3.8, 0, 0.05, 0, 0, 1, 0)
        
        # Lights
        glEnable(GL_LIGHTING)
        glEnable(GL_LIGHT0)
        glEnable(GL_LIGHT1)
        glEnable(GL_DEPTH_TEST)
        glEnable(GL_NORMALIZE)
        
        # Light positions
        glLightfv(GL_LIGHT0, GL_POSITION, [4, 5, 3, 1])
        glLightfv(GL_LIGHT0, GL_DIFFUSE, [1, 0.9, 0.8, 1])
        glLightfv(GL_LIGHT1, GL_POSITION, [-3, 1, 4, 1])
        glLightfv(GL_LIGHT1, GL_DIFFUSE, [0.8, 0.9, 1, 1])
        
        # Background
        glClearColor(0.1, 0.17, 0.24, 1)
        
        # Mouse control
        self.rot_x = 0
        self.rot_y = 0
        self.zoom = -5
        self.mouse_down = False
        
        # Build surfboard
        self.surfboard = self.build_surfboard()
        
    def build_surfboard(self):
        """Create surfboard using GLUT primitives"""
        # We'll use a display list for performance
        board = glGenLists(1)
        glNewList(board, GL_COMPILE)
        
        # Material: Foam core
        glMaterialfv(GL_FRONT, GL_AMBIENT, [0.4, 0.38, 0.35, 1])
        glMaterialfv(GL_FRONT, GL_DIFFUSE, [0.94, 0.93, 0.88, 1])
        glMaterialfv(GL_FRONT, GL_SPECULAR, [0.2, 0.2, 0.2, 1])
        glMaterialf(GL_FRONT, GL_SHININESS, 20)
        
        # Main board - using a custom lathe approach with GLU
        # Since GLU doesn't have lathe, we approximate with spheres + boxes
        glPushMatrix()
        glRotatef(-90, 0, 0, 1)  # Rotate to lie along X
        
        # Central box
        glPushMatrix()
        glScalef(2.0, 0.12, 0.6)
        glutSolidCube(1.0)
        glPopMatrix()
        
        # Nose sphere
        glPushMatrix()
        glTranslatef(1.1, 0, 0)
        glScalef(0.3, 0.12, 0.6)
        glutSolidSphere(1.0, 20, 20)
        glPopMatrix()
        
        # Tail sphere (slightly flattened)
        glPushMatrix()
        glTranslatef(-1.1, 0, 0)
        glScalef(0.25, 0.10, 0.5)
        glutSolidSphere(1.0, 20, 20)
        glPopMatrix()
        
        glPopMatrix()
        
        # Fins (thruster setup)
        glMaterialfv(GL_FRONT, GL_AMBIENT, [0.2, 0.25, 0.3, 1])
        glMaterialfv(GL_FRONT, GL_DIFFUSE, [0.4, 0.5, 0.6, 1])
        glMaterialfv(GL_FRONT, GL_SPECULAR, [0.5, 0.5, 0.5, 1])
        glMaterialf(GL_FRONT, GL_SHININESS, 40)
        
        # Center fin
        glPushMatrix()
        glTranslatef(-0.75, -0.08, 0)
        glRotatef(10, 1, 0, 0)
        glScalef(0.12, 0.3, 0.02)
        glutSolidCube(1.0)
        glPopMatrix()
        
        # Side fins
        for z in [-0.22, 0.22]:
            glPushMatrix()
            glTranslatef(-0.65, -0.06, z)
            glRotatef(-10, 1, 0, 0)
            glScalef(0.08, 0.2, 0.02)
            glutSolidCube(1.0)
            glPopMatrix()
        
        # Deck pad
        glMaterialfv(GL_FRONT, GL_AMBIENT, [0.1, 0.1, 0.1, 1])
        glMaterialfv(GL_FRONT, GL_DIFFUSE, [0.15, 0.15, 0.15, 1])
        glMaterialfv(GL_FRONT, GL_SPECULAR, [0, 0, 0, 1])
        
        glPushMatrix()
        glTranslatef(0.4, 0.06, 0)
        glRotatef(-5, 1, 0, 0)
        glScalef(0.4, 0.01, 0.35)
        glutSolidCube(1.0)
        glPopMatrix()
        
        # Stringer (wood line)
        glMaterialfv(GL_FRONT, GL_AMBIENT, [0.5, 0.4, 0.3, 1])
        glMaterialfv(GL_FRONT, GL_DIFFUSE, [0.6, 0.5, 0.4, 1])
        
        glPushMatrix()
        glTranslatef(0, 0, 0)
        glScalef(0.01, 1.8, 0.01)
        glutSolidCube(1.0)
        glPopMatrix()
        
        glEndList()
        return board
    
    def render(self):
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glLoadIdentity()
        
        # Camera orbit
        glTranslatef(0, 0, self.zoom)
        glRotatef(self.rot_x, 1, 0, 0)
        glRotatef(self.rot_y, 0, 1, 0)
        glTranslatef(0, -0.1, 0)
        
        # Render surfboard
        glCallList(self.surfboard)
        
        # Grid
        glDisable(GL_LIGHTING)
        glColor3f(0.3, 0.4, 0.5)
        glBegin(GL_LINES)
        for i in range(-3, 4):
            glVertex3f(i, -0.2, -3)
            glVertex3f(i, -0.2, 3)
            glVertex3f(-3, -0.2, i)
            glVertex3f(3, -0.2, i)
        glEnd()
        glEnable(GL_LIGHTING)
        
        pygame.display.flip()
    
    def run(self):
        clock = pygame.time.Clock()
        running = True
        
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 4:  # Scroll up
                        self.zoom += 0.5
                    elif event.button == 5:  # Scroll down
                        self.zoom -= 0.5
                elif event.type == pygame.MOUSEMOTION:
                    if pygame.mouse.get_pressed()[0]:
                        dx, dy = event.rel
                        self.rot_y += dx * 0.5
                        self.rot_x += dy * 0.5
            
            self.render()
            clock.tick(60)
        
        pygame.quit()

if __name__ == "__main__":
    # Need to initialize GLUT for glutSolidCube
    glutInit([])
    scene = SurfboardScene()
    scene.run()
