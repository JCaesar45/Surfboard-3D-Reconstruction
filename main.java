/**
 * Surfboard 3D Reconstruction - Java/LWJGL
 * Requires: org.lwjgl:lwjgl:3.3.3
 */
import org.lwjgl.*;
import org.lwjgl.glfw.*;
import org.lwjgl.opengl.*;
import org.lwjgl.system.*;
import java.nio.*;

import static org.lwjgl.glfw.Callbacks.*;
import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.opengl.GL11.*;
import static org.lwjgl.opengl.GL12.*;
import static org.lwjgl.opengl.GL15.*;
import static org.lwjgl.opengl.GL20.*;
import static org.lwjgl.opengl.GL30.*;
import static org.lwjgl.system.MemoryStack.*;
import static org.lwjgl.system.MemoryUtil.*;

public class Surfboard3D {
    private long window;
    private float rotX = 0, rotY = 0, zoom = -5;
    private int boardDisplayList;
    private int width = 800, height = 600;
    
    public void run() {
        init();
        loop();
        cleanup();
    }
    
    private void init() {
        GLFWErrorCallback.createPrint(System.err).set();
        
        if (!glfwInit()) {
            throw new IllegalStateException("Unable to initialize GLFW");
        }
        
        glfwDefaultWindowHints();
        glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
        glfwWindowHint(GLFW_RESIZABLE, GLFW_TRUE);
        
        window = glfwCreateWindow(width, height, "Surfboard 3D - Java", NULL, NULL);
        if (window == NULL) {
            throw new RuntimeException("Failed to create window");
        }
        
        glfwMakeContextCurrent(window);
        glfwSwapInterval(1);
        glfwShowWindow(window);
        
        GL.createCapabilities();
        
        // Setup perspective
        glMatrixMode(GL_PROJECTION);
        glLoadIdentity();
        gluPerspective(35, (float)width/height, 0.1f, 100);
        glMatrixMode(GL_MODELVIEW);
        
        // Lighting
        glEnable(GL_LIGHTING);
        glEnable(GL_LIGHT0);
        glEnable(GL_LIGHT1);
        glEnable(GL_DEPTH_TEST);
        glEnable(GL_NORMALIZE);
        
        float[] lightPos0 = {4, 5, 3, 1};
        float[] diff0 = {1, 0.9f, 0.8f, 1};
        float[] lightPos1 = {-3, 1, 4, 1};
        float[] diff1 = {0.8f, 0.9f, 1, 1};
        
        glLightfv(GL_LIGHT0, GL_POSITION, lightPos0);
        glLightfv(GL_LIGHT0, GL_DIFFUSE, diff0);
        glLightfv(GL_LIGHT1, GL_POSITION, lightPos1);
        glLightfv(GL_LIGHT1, GL_DIFFUSE, diff1);
        
        glClearColor(0.1f, 0.17f, 0.24f, 1);
        
        // Build surfboard display list
        buildSurfboard();
        
        // Mouse controls
        glfwSetMouseButtonCallback(window, (w, button, action, mods) -> {
            // Handle mouse
        });
        glfwSetScrollCallback(window, (w, xoffset, yoffset) -> {
            zoom += yoffset * 0.5f;
        });
    }
    
    private void buildSurfboard() {
        boardDisplayList = glGenLists(1);
        glNewList(boardDisplayList, GL_COMPILE);
        
        // Board material - foam
        float[] ambient = {0.4f, 0.38f, 0.35f, 1};
        float[] diffuse = {0.94f, 0.93f, 0.88f, 1};
        float[] specular = {0.2f, 0.2f, 0.2f, 1};
        
        glMaterialfv(GL_FRONT, GL_AMBIENT, ambient);
        glMaterialfv(GL_FRONT, GL_DIFFUSE, diffuse);
        glMaterialfv(GL_FRONT, GL_SPECULAR, specular);
        glMaterialf(GL_FRONT, GL_SHININESS, 20);
        
        glPushMatrix();
        glRotatef(-90, 0, 0, 1);
        
        // Central box
        glPushMatrix();
        glScalef(2.0f, 0.12f, 0.6f);
        glutSolidCube(1.0);
        glPopMatrix();
        
        // Nose
        glPushMatrix();
        glTranslatef(1.1f, 0, 0);
        glScalef(0.3f, 0.12f, 0.6f);
        glutSolidSphere(1.0, 20, 20);
        glPopMatrix();
        
        // Tail
        glPushMatrix();
        glTranslatef(-1.1f, 0, 0);
        glScalef(0.25f, 0.10f, 0.5f);
        glutSolidSphere(1.0, 20, 20);
        glPopMatrix();
        
        glPopMatrix();
        
        // Fins
        float[] finAmbient = {0.2f, 0.25f, 0.3f, 1};
        float[] finDiffuse = {0.4f, 0.5f, 0.6f, 1};
        float[] finSpecular = {0.5f, 0.5f, 0.5f, 1};
        
        glMaterialfv(GL_FRONT, GL_AMBIENT, finAmbient);
        glMaterialfv(GL_FRONT, GL_DIFFUSE, finDiffuse);
        glMaterialfv(GL_FRONT, GL_SPECULAR, finSpecular);
        glMaterialf(GL_FRONT, GL_SHININESS, 40);
        
        // Center fin
        glPushMatrix();
        glTranslatef(-0.75f, -0.08f, 0);
        glRotatef(10, 1, 0, 0);
        glScalef(0.12f, 0.3f, 0.02f);
        glutSolidCube(1.0);
        glPopMatrix();
        
        // Side fins
        float[] zPositions = {-0.22f, 0.22f};
        for (float z : zPositions) {
            glPushMatrix();
            glTranslatef(-0.65f, -0.06f, z);
            glRotatef(-10, 1, 0, 0);
            glScalef(0.08f, 0.2f, 0.02f);
            glutSolidCube(1.0);
            glPopMatrix();
        }
        
        // Deck pad
        float[] padAmbient = {0.1f, 0.1f, 0.1f, 1};
        float[] padDiffuse = {0.15f, 0.15f, 0.15f, 1};
        glMaterialfv(GL_FRONT, GL_AMBIENT, padAmbient);
        glMaterialfv(GL_FRONT, GL_DIFFUSE, padDiffuse);
        
        glPushMatrix();
        glTranslatef(0.4f, 0.06f, 0);
        glRotatef(-5, 1, 0, 0);
        glScalef(0.4f, 0.01f, 0.35f);
        glutSolidCube(1.0);
        glPopMatrix();
        
        // Stringer
        float[] woodAmbient = {0.5f, 0.4f, 0.3f, 1};
        float[] woodDiffuse = {0.6f, 0.5f, 0.4f, 1};
        glMaterialfv(GL_FRONT, GL_AMBIENT, woodAmbient);
        glMaterialfv(GL_FRONT, GL_DIFFUSE, woodDiffuse);
        
        glPushMatrix();
        glScalef(0.01f, 1.8f, 0.01f);
        glutSolidCube(1.0);
        glPopMatrix();
        
        glEndList();
    }
    
    private void loop() {
        while (!glfwWindowShouldClose(window)) {
            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
            glLoadIdentity();
            
            // Camera transform
            glTranslatef(0, 0, zoom);
            glRotatef(rotX, 1, 0, 0);
            glRotatef(rotY, 0, 1, 0);
            
            // Render
            glCallList(boardDisplayList);
            
            // Grid
            glDisable(GL_LIGHTING);
            glColor3f(0.3f, 0.4f, 0.5f);
            glBegin(GL_LINES);
            for (int i = -3; i <= 3; i++) {
                glVertex3f(i, -0.2f, -3);
                glVertex3f(i, -0.2f, 3);
                glVertex3f(-3, -0.2f, i);
                glVertex3f(3, -0.2f, i);
            }
            glEnd();
            glEnable(GL_LIGHTING);
            
            glfwSwapBuffers(window);
            glfwPollEvents();
            
            // Mouse movement for orbit
            double[] xpos = new double[1];
            double[] ypos = new double[1];
            glfwGetCursorPos(window, xpos, ypos);
            // Simplified orbit control
        }
    }
    
    private void cleanup() {
        glDeleteLists(boardDisplayList, 1);
        glfwDestroyWindow(window);
        glfwTerminate();
    }
    
    private static native void glutSolidCube(double size);
    private static native void glutSolidSphere(double radius, int slices, int stacks);
    private static native void gluPerspective(double fovy, double aspect, double zNear, double zFar);
    
    static {
        System.loadLibrary("GLU");
        System.loadLibrary("glut");
    }
    
    public static void main(String[] args) {
        new Surfboard3D().run();
    }
}
